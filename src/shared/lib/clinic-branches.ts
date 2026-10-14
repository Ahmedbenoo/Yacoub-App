export const CLINIC_BRANCHES = [
  { id: 'branch-001', clinicId: 'clinic-001', name: 'Main Clinic', labelKey: 'branches.main' },
  { id: 'branch-002', clinicId: 'clinic-003', name: 'North Branch', labelKey: 'branches.north' },
  { id: 'branch-downtown', clinicId: 'clinic-002', name: 'Downtown Branch', labelKey: 'branches.downtown' },
] as const;

export type ClinicBranch = (typeof CLINIC_BRANCHES)[number];

export function getBranchById(id: string): ClinicBranch | undefined {
  return CLINIC_BRANCHES.find((branch) => branch.id === id);
}

export function getBranchByName(name: string): ClinicBranch | undefined {
  return CLINIC_BRANCHES.find((branch) => branch.name === name);
}

export function resolveBranchName(id: string): string {
  return getBranchById(id)?.name ?? id;
}

export function branchNameForClinic(clinicId: string): string | undefined {
  return CLINIC_BRANCHES.find((branch) => branch.clinicId === clinicId)?.name;
}
