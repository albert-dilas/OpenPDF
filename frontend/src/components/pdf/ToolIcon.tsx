/* eslint-disable @next/next/no-img-element */
import React from 'react';
import {
  LayoutGrid,
  FileSliders,
  FileText,
  PenTool,
  EyeOff,
  Globe,
  Languages,
  QrCode,
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

  const imgDimensions =
    size === 'sm' ? 'h-7 w-7' : size === 'md' ? 'h-10 w-10' : 'h-14 w-14';

  const iconSize = size === 'sm' ? 18 : size === 'md' ? 24 : 28;

  if (tool.iconUrl) {
    return (
      <div className="flex items-center justify-center shrink-0">
        <img
          src={tool.iconUrl}
          alt={tool.name}
          className={`${imgDimensions} object-contain select-none`}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dimensions} ${tool.color} text-white shadow-md flex items-center justify-center shrink-0`}
    >
      {tool.iconName === 'layout-grid' ? (
        <LayoutGrid size={iconSize} strokeWidth={2} />
      ) : tool.iconName === 'file-sliders' ? (
        <FileSliders size={iconSize} strokeWidth={2} />
      ) : tool.iconName === 'pen-tool' ? (
        <PenTool size={iconSize} strokeWidth={2} />
      ) : tool.iconName === 'eye-off' ? (
        <EyeOff size={iconSize} strokeWidth={2} />
      ) : tool.iconName === 'globe' ? (
        <Globe size={iconSize} strokeWidth={2} />
      ) : tool.iconName === 'languages' ? (
        <Languages size={iconSize} strokeWidth={2} />
      ) : tool.iconName === 'qr-code' ? (
        <QrCode size={iconSize} strokeWidth={2} />
      ) : (
        <FileText size={iconSize} strokeWidth={2} />
      )}
    </div>
  );
}
