import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw, Save, Eye } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import {
  HOMEPAGE_SECTIONS,
  HOMEPAGE_SECTIONS_SETTING_KEY,
  defaultHomepageSectionState,
  parseHomepageSectionState,
  type HomepageSectionState,
} from "@/data/homepageSections";
import type { AdminRole } from "@/types/domain";

interface AdminHomepageBuilderPageProps {
  email: string;
  role: AdminRole;
}

export const getServerSideProps: GetServerSideProps<AdminHomepageBuilderPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_SETTINGS);
  if ("redirect" in guard) return guard;
  return { props: { email: guard.session.email, role: guard.session.role } };
};

const LABEL_BY_ID = Object.fromEntries(HOMEPAGE_SECTIONS.map((s) => [s.id, s]));

// Rough color families so the live preview reads as distinct "kinds" of
// section at a glance rather than a flat list of identical gray bars.
function previewTone(id: string): string {
  if (id.startsWith("promo")) return "bg-orange-100 border-orange-300 dark:bg-orange-950/40 dark:border-orange-800";
  if (id === "categories" || id === "brands") return "bg-blue-100 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800";
  if (id === "flashDeals" || id === "todaysDeals" || id === "specialOffers")
    return "bg-red-100 border-red-300 dark:bg-red-950/40 dark:border-red-800";
  return "bg-muted border-border";
}

function SortableRow({
  section,
  onToggle,
}: {
  section: HomepageSectionState;
  onToggle: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const def = LABEL_BY_ID[section.id];
  if (!def) return null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 rounded-lg border bg-card p-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label={`Drag to reorder ${def.label}`}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${section.enabled ? "" : "text-muted-foreground"}`}>{def.label}</p>
        <p className="truncate text-xs text-muted-foreground">{def.description}</p>
      </div>
      <Switch checked={section.enabled} onCheckedChange={() => onToggle(section.id)} aria-label={`Toggle ${def.label}`} />
    </div>
  );
}

export default function AdminHomepageBuilderPage({ email, role }: AdminHomepageBuilderPageProps) {
  const [sections, setSections] = useState<HomepageSectionState[]>(defaultHomepageSectionState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const raw = (data.settings || {})[HOMEPAGE_SECTIONS_SETTING_KEY];
        setSections(parseHomepageSectionState(raw));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setDirty(true);
  };

  const toggle = (id: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
    setDirty(true);
  };

  const resetToDefault = () => {
    setSections(defaultHomepageSectionState());
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: HOMEPAGE_SECTIONS_SETTING_KEY, value: JSON.stringify(sections) }),
      });
      if (!res.ok) throw new Error("Failed to save.");
      toast.success("Homepage layout saved.");
      setDirty(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Homepage Builder" email={email} role={role}>
      <div className="shadcn-root">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">Homepage Builder</h1>
            <p className="text-sm text-muted-foreground">
              Drag to reorder homepage sections and toggle them on or off. Changes apply live within about a
              minute of saving.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefault} disabled={loading}>
              <RotateCcw className="size-4" /> Reset to Default
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || loading || !dirty}>
              <Save className="size-4" /> {saving ? "Saving…" : "Save Layout"}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-2">
              <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                Hero Banner and Newsletter are always shown first/last and aren&rsquo;t listed here.
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {sections.map((s) => (
                      <SortableRow key={s.id} section={s} onToggle={toggle} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <Card className="h-fit lg:sticky lg:top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="size-4" /> Live Preview
                </CardTitle>
                <CardDescription>Reflects your unsaved changes as you drag and toggle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="rounded border border-dashed border-border bg-muted/60 px-2 py-2 text-center text-[11px] font-medium text-muted-foreground">
                  Hero Banner
                </div>
                {sections
                  .filter((s) => s.enabled)
                  .map((s) => (
                    <div
                      key={s.id}
                      className={`rounded border px-2 py-1.5 text-center text-[11px] font-medium ${previewTone(s.id)}`}
                    >
                      {LABEL_BY_ID[s.id]?.label}
                    </div>
                  ))}
                <div className="rounded border border-dashed border-border bg-muted/60 px-2 py-2 text-center text-[11px] font-medium text-muted-foreground">
                  Newsletter
                </div>
                {sections.every((s) => !s.enabled) && (
                  <p className="pt-1 text-center text-xs text-muted-foreground">All sections are hidden.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
