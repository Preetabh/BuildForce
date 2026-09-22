import React from 'react';
import { Project } from '../../types';
import { ProjectCard } from './ProjectCard';
import { LoadingGrid } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { Plus, FolderKanban } from 'lucide-react';

export interface ProjectGridProps {
  projects: Project[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onNewProject?: () => void;
  onEdit: (project: Project) => void;
  onArchive: (projectId: string) => void;
  onDelete: (projectId: string, projectName: string) => void;
  isFiltered?: boolean;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onNewProject,
  onEdit,
  onArchive,
  onDelete,
  isFiltered,
}) => {
  if (isLoading) {
    return <LoadingGrid count={6} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to Load Projects"
        message={errorMessage || 'An error occurred while communicating with the server.'}
        onRetry={onRetry}
      />
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title={isFiltered ? 'No Projects Found' : 'No Projects Yet'}
        description={
          isFiltered
            ? 'No projects match your current search and filter criteria. Try adjusting your query.'
            : 'Get started by creating your first construction project to track estimates, BOQ, and timelines.'
        }
        actionLabel={isFiltered ? undefined : 'Create First Project'}
        onAction={onNewProject}
        actionIcon={<Plus className="w-4 h-4" />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {projects.map((project) => (
        <ProjectCard
          key={project._id}
          project={project}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
