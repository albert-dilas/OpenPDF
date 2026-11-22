import UniversalStudioToolView from '@/components/studios/UniversalStudioToolView';
import { DYNAMIC_STUDIO_TOOL_IDS } from '@/config/studios';

export const dynamicParams = false;

export function generateStaticParams(): { toolId: string }[] {
  return DYNAMIC_STUDIO_TOOL_IDS.map((toolId) => ({ toolId }));
}

export default function DynamicStudioToolPage({
  params,
}: {
  params: { toolId: string };
}) {
  return <UniversalStudioToolView toolId={params.toolId} />;
}
