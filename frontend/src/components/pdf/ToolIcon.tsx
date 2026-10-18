import React from 'react';
import {
  Combine,
  Scissors,
  LayoutGrid,
  RotateCw,
  FileDown,
  ScanText,
  FileText,
  FileOutput,
  ImagePlus,
  Images,
  FileCode2,
  Globe,
  Languages,
  Stamp,
  Hash,
  SlidersHorizontal,
  QrCode,
  PenTool,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';
import { ToolItem } from '@/config/tools';

interface ToolIconProps {
  tool: Pick<ToolItem, 'name' | 'iconUrl' | 'iconName' | 'color'>;
  size?: 'sm' | 'md' | 'lg';
}

export default function ToolIcon({ tool, size = 'lg' }: ToolIconProps) {
  const dimensions =
    size === 'sm'
      ? 'h-9 w-9 rounded-xl'
      : size === 'md'
      ? 'h-12 w-12 rounded-xl'
      : 'h-14 w-14 rounded-2xl';

  const iconSize = size === 'sm' ? 18 : size === 'md' ? 23 : 27;

  const renderVectorIcon = () => {
    switch (tool.iconName) {
      case 'combine':
        return <Combine size={iconSize} strokeWidth={2.1} />;
      case 'scissors':
        return <Scissors size={iconSize} strokeWidth={2.1} />;
      case 'layout-grid':
        return <LayoutGrid size={iconSize} strokeWidth={2.1} />;
      case 'rotate-cw':
        return <RotateCw size={iconSize} strokeWidth={2.1} />;
      case 'file-down':
        return <FileDown size={iconSize} strokeWidth={2.1} />;
      case 'scan-text':
        return <ScanText size={iconSize} strokeWidth={2.1} />;
      case 'file-text':
        return <FileText size={iconSize} strokeWidth={2.1} />;
      case 'file-output':
        return <FileOutput size={iconSize} strokeWidth={2.1} />;
      case 'image-plus':
        return <ImagePlus size={iconSize} strokeWidth={2.1} />;
      case 'images':
        return <Images size={iconSize} strokeWidth={2.1} />;
      case 'file-code-2':
        return <FileCode2 size={iconSize} strokeWidth={2.1} />;
      case 'globe':
        return <Globe size={iconSize} strokeWidth={2.1} />;
      case 'languages':
        return <Languages size={iconSize} strokeWidth={2.1} />;
      case 'stamp':
        return <Stamp size={iconSize} strokeWidth={2.1} />;
      case 'hash':
        return <Hash size={iconSize} strokeWidth={2.1} />;
      case 'sliders-horizontal':
      case 'file-sliders':
        return <SlidersHorizontal size={iconSize} strokeWidth={2.1} />;
      case 'qr-code':
        return <QrCode size={iconSize} strokeWidth={2.1} />;
      case 'pen-tool':
        return <PenTool size={iconSize} strokeWidth={2.1} />;
      case 'eye-off':
        return <EyeOff size={iconSize} strokeWidth={2.1} />;
      case 'lock':
        return <Lock size={iconSize} strokeWidth={2.1} />;
      case 'unlock':
        return <Unlock size={iconSize} strokeWidth={2.1} />;
      default:
        return <FileText size={iconSize} strokeWidth={2.1} />;
    }
  };

  return (
    <div
      className={`${dimensions} ${tool.color} text-white shadow-md ring-1 ring-inset ring-white/25 flex items-center justify-center shrink-0 select-none`}
      aria-hidden="true"
    >
      {renderVectorIcon()}
    </div>
  );
}
