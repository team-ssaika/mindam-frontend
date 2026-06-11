import type { UserDepartment } from '../../profile/api/userApi';

export function formatOfficerDepartments(departments: UserDepartment[] | undefined): string {
  if (!departments?.length) {
    return '담당 부서 정보 없음';
  }

  const agencyNames = [...new Set(departments.map((department) => department.agencyType.name))];
  const departmentNames = departments.map((department) => department.name).join(', ');

  if (agencyNames.length === 1) {
    return `${agencyNames[0]} · ${departmentNames}`;
  }

  return departments
    .map((department) => `${department.agencyType.name} · ${department.name}`)
    .join(' / ');
}
