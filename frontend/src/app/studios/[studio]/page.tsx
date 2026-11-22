import StudioWorkspaceView from '@/components/studios/StudioWorkspaceView';
import { DEFAULT_STUDIO_ORDER, StudioId } from '@/config/studios';

export const dynamicParams = false;

export function generateStaticParams(): { studio: StudioId }[] {
  return DEFAULT_STUDIO_ORDER.map((studio) => ({ studio }));
}

export default function StudioPage({
  params,
}: {
  params: { studio: StudioId };
}) {
  return <StudioWorkspaceView studioId={params.studio} />;
}
