"use server";

import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth";
import {
  approveInstructionVersion,
  createInstructionDraft,
  markInstructionTested,
  saveInstructionDraft,
  validateInstructionVersion,
} from "@/services/admin-instruction.service";

function instructionId(formData: FormData) {
  const id = Number(formData.get("instructionId"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid instruction version.");
  return id;
}

export async function createInstructionDraftAction() {
  const user = await requireAdminUser();
  const draft = await createInstructionDraft({
    restaurantId: user.restaurantId,
    actorStaffId: user.id,
  });
  redirect(`/admin/instructions/draft?id=${draft.id}`);
}

export async function saveInstructionDraftAction(formData: FormData) {
  const user = await requireAdminUser();
  const id = instructionId(formData);
  await saveInstructionDraft({
    restaurantId: user.restaurantId,
    actorStaffId: user.id,
    id,
    rolePrompt: String(formData.get("rolePrompt") ?? ""),
    handoverPrompt: String(formData.get("handoverPrompt") ?? ""),
    releaseNotes: String(formData.get("releaseNotes") ?? ""),
  });
  redirect(`/admin/instructions/draft?id=${id}&saved=1`);
}

export async function validateInstructionAction(formData: FormData) {
  const user = await requireAdminUser();
  const id = instructionId(formData);
  await validateInstructionVersion({ restaurantId: user.restaurantId, actorStaffId: user.id, id });
  redirect(`/admin/instructions/validation?id=${id}`);
}

export async function testInstructionAction(formData: FormData) {
  const user = await requireAdminUser();
  const id = instructionId(formData);
  await markInstructionTested({ restaurantId: user.restaurantId, actorStaffId: user.id, id });
  redirect(`/admin/instructions/playground?id=${id}&tested=1`);
}

export async function approveInstructionAction(formData: FormData) {
  const user = await requireAdminUser();
  const id = instructionId(formData);
  await approveInstructionVersion({ restaurantId: user.restaurantId, actorStaffId: user.id, id });
  redirect(`/admin/instructions/publish?id=${id}`);
}
