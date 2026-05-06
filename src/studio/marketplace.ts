import { NoteLoader } from "../notes/loader.js";
import { installNote, removeNote } from "../notes/installer.js";
import type { InstalledNote } from "../notes/types.js";
import type {
  StudioMarketplaceNote,
  StudioMarketplaceNoteSource,
  StudioMarketplaceNotesPayload,
} from "./types.js";

export async function listMarketplaceNotes(projectRoot: string): Promise<StudioMarketplaceNotesPayload> {
  const loader = new NoteLoader(projectRoot);
  const [legacySkills, builtInPackages, workspaceSkills, installedNotes] = await Promise.all([
    loader.loadBuiltInNotes(),
    loader.loadBuiltInNotePackages(),
    loader.loadWorkspaceSkillNotes(),
    loader.loadInstalledNotes(),
  ]);
  const builtInIds = new Set([...legacySkills, ...builtInPackages].map((note) => note.manifest.name));
  const installableIds = new Set(builtInPackages.map((note) => note.manifest.name));
  const rows = new Map<string, StudioMarketplaceNote>();

  for (const note of legacySkills) {
    rows.set(note.manifest.name, serializeMarketplaceNote(note, {
      source: "legacy-skill",
      installed: false,
      builtIn: true,
      installable: false,
    }));
  }
  for (const note of builtInPackages) {
    rows.set(note.manifest.name, serializeMarketplaceNote(note, {
      source: "built-in-note",
      installed: false,
      builtIn: true,
      installable: true,
    }));
  }
  for (const note of workspaceSkills) {
    rows.set(note.manifest.name, serializeMarketplaceNote(note, {
      source: "workspace-skill",
      installed: true,
      builtIn: builtInIds.has(note.manifest.name),
      installable: false,
    }));
  }
  for (const note of installedNotes) {
    rows.set(note.manifest.name, serializeMarketplaceNote(note, {
      source: "installed-note",
      installed: true,
      builtIn: builtInIds.has(note.manifest.name),
      installable: installableIds.has(note.manifest.name),
    }));
  }

  const notes = Array.from(rows.values()).sort((left, right) => {
    if (left.installed !== right.installed) return left.installed ? -1 : 1;
    if (left.category !== right.category) return left.category.localeCompare(right.category);
    return left.title.localeCompare(right.title);
  });

  return {
    notes,
    summary: {
      total: notes.length,
      builtIn: notes.filter((note) => note.builtIn).length,
      installed: notes.filter((note) => note.installed).length,
      installable: notes.filter((note) => note.installable).length,
      categories: notes.reduce<Record<string, number>>((acc, note) => {
        acc[note.category] = (acc[note.category] ?? 0) + 1;
        return acc;
      }, {}),
    },
  };
}

export async function installMarketplaceNote(
  projectRoot: string,
  input: { noteId?: string; source?: string },
): Promise<StudioMarketplaceNotesPayload> {
  const source = input.source?.trim();
  if (source) {
    await installNote(source, projectRoot);
    return listMarketplaceNotes(projectRoot);
  }

  const noteId = input.noteId?.trim();
  if (!noteId) {
    throw Object.assign(new Error("noteId or source is required"), { statusCode: 400 });
  }

  const marketplace = await listMarketplaceNotes(projectRoot);
  const note = marketplace.notes.find((candidate) => candidate.id === noteId || candidate.name === noteId);
  if (!note) {
    throw Object.assign(new Error(`Unknown marketplace note: ${noteId}`), { statusCode: 404 });
  }
  if (!note.installable) {
    throw Object.assign(new Error(`Marketplace note is not installable: ${note.name}`), { statusCode: 400 });
  }

  await installNote(note.sourcePath, projectRoot);
  return listMarketplaceNotes(projectRoot);
}

export async function removeMarketplaceNote(
  projectRoot: string,
  input: { name?: string },
): Promise<StudioMarketplaceNotesPayload> {
  const name = input.name?.trim();
  if (!name) {
    throw Object.assign(new Error("name is required"), { statusCode: 400 });
  }
  await removeNote(name, projectRoot);
  return listMarketplaceNotes(projectRoot);
}

function serializeMarketplaceNote(
  note: InstalledNote,
  meta: {
    source: StudioMarketplaceNoteSource;
    installed: boolean;
    builtIn: boolean;
    installable: boolean;
  },
): StudioMarketplaceNote {
  const manifest = note.manifest;
  return {
    id: manifest.name,
    name: manifest.name,
    title: manifest.skills[0]?.name ?? titleize(manifest.name),
    category: manifest.category,
    description: manifest.description,
    source: meta.source,
    sourcePath: note.path,
    sourceUrl: null,
    packageName: null,
    version: manifest.version,
    installed: meta.installed,
    builtIn: meta.builtIn,
    installable: meta.installable,
    tags: manifest.tags,
  };
}

function titleize(value: string): string {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
