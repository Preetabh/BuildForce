import { ProjectStatus, ProjectType } from '../../models/Project';

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  draftProjects: number;
  onHoldProjects: number;
  archivedProjects: number;
  totalProjectValue: number;
  currency: string;
}

export interface ProjectQueryParams {
  search?: string;
  status?: ProjectStatus | 'all';
  projectType?: ProjectType | 'all';
  isArchived?: boolean | string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
