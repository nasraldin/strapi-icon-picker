import React from 'react';
import * as LucideIcons from 'lucide-react';
import * as DuoIcons from 'duo-icons';

// Get all valid Lucide icon names by checking exports
const getValidLucideIconNames = (): string[] => {
  const validNamesSet = new Set<string>();
  const allKeys = Object.keys(LucideIcons);

  let skippedCount = 0;
  let processedCount = 0;

  allKeys.forEach((name) => {
    processedCount += 1;

    // Skip non-icon exports
    if (
      name === 'createLucideIcon' ||
      name === 'Icon' ||
      name === 'default' ||
      name.startsWith('_')
    ) {
      skippedCount += 1;
      return;
    }

    // Skip names ending with 'Icon' suffix - we prefer the base name
    // e.g., prefer 'Home' over 'HomeIcon'
    if (name.endsWith('Icon')) {
      skippedCount += 1;
      return; // Always skip 'Icon' suffixed names
    }

    // Check if it starts with uppercase letter (Lucide icons are PascalCase)
    if (name.length === 0) {
      skippedCount += 1;
      return;
    }
    const firstChar = name[0];
    if (firstChar !== firstChar.toUpperCase()) {
      skippedCount += 1;
      return;
    }

    const IconComponent = LucideIcons[name as keyof typeof LucideIcons];

    // Accept any non-null/undefined value - React.createElement can handle both functions and objects
    // React components can be functions, objects (forwardRef, memo), or other valid component types
    if (!IconComponent || IconComponent === null || IconComponent === undefined) {
      skippedCount += 1;
      return;
    }

    // Basic validation: should be a function or object (React components are one of these)
    const isValidType = typeof IconComponent === 'function' || typeof IconComponent === 'object';
    if (!isValidType) {
      skippedCount += 1;
      return;
    }

    // Add to set (will automatically deduplicate)
    validNamesSet.add(name);
  });

  const result = Array.from(validNamesSet).sort((a, b) => a.localeCompare(b));

  return result;
};

// Get all valid Duo icon names by checking exports
const getValidDuoIconNames = (): string[] => {
  const validNames: string[] = [];

  // Duo Icons exports an 'icons' object that contains all the icon components
  if ('icons' in DuoIcons && DuoIcons.icons && typeof DuoIcons.icons === 'object') {
    const iconsObject = DuoIcons.icons as Record<string, React.ComponentType>;
    const iconKeys = Object.keys(iconsObject);

    let duoProcessed = 0;
    let duoSkipped = 0;

    iconKeys.forEach((name) => {
      duoProcessed += 1;

      // Skip non-icon exports
      if (name === 'default' || name.startsWith('_')) {
        duoSkipped += 1;
        return;
      }

      // Duo icons use lowercase with underscores (e.g., 'add_circle', 'airplay')
      // So we don't check for uppercase - just validate it's a valid name
      if (name.length === 0) {
        duoSkipped += 1;
        return;
      }

      const IconComponent = iconsObject[name];

      // Accept any non-null/undefined value - React.createElement can handle both functions and objects
      if (!IconComponent || IconComponent === null || IconComponent === undefined) {
        duoSkipped += 1;
        return;
      }

      // Duo icons are SVG path strings, not components
      // We'll create SVG elements from them in the render function
      // So accept any non-null value (strings are valid)
      if (typeof IconComponent === 'string') {
        // Valid - it's an SVG path string
        validNames.push(name);
      } else {
        duoSkipped += 1;
      }
    });
  }

  return validNames.sort((a, b) => a.localeCompare(b));
};

// Create validated arrays of icon names (computed once at module load)
export const LUCIDE_ICON_NAMES: readonly string[] = getValidLucideIconNames();
export const DUO_ICON_NAMES: readonly string[] = getValidDuoIconNames();

// Helper function to get all valid Lucide icon names
export const getLucideIconNames = (): string[] => {
  return [...LUCIDE_ICON_NAMES];
};

// Helper function to get all valid Duo icon names
export const getDuoIconNames = (): string[] => {
  return [...DUO_ICON_NAMES];
};

// Helper function to render a Lucide icon by name (only if name is in validated list)
export const renderLucideIcon = (iconName: string, size = 24): React.ReactElement | null => {
  if (!iconName || typeof iconName !== 'string') {
    return null;
  }

  // Only render if icon name is in our validated list
  if (!LUCIDE_ICON_NAMES.includes(iconName)) {
    return null;
  }

  try {
    const iconKey = iconName as keyof typeof LucideIcons;

    // Check if the key exists in the object
    if (!(iconKey in LucideIcons)) {
      return null;
    }

    const IconComponent = LucideIcons[iconKey];

    // Double check it exists and is valid
    if (!IconComponent || IconComponent === undefined || IconComponent === null) {
      return null;
    }

    // Lucide icons can be objects (React components) or functions
    // Accept both types - React.createElement can handle both
    const isFunction = typeof IconComponent === 'function';
    const isObject = typeof IconComponent === 'object' && IconComponent !== null;

    if (!isFunction && !isObject) {
      // Silently skip - this is expected for some exports
      return null;
    }

    // If it's already a React element, return it
    if (React.isValidElement(IconComponent)) {
      return IconComponent;
    }

    // Ensure we have a valid component before creating element
    // React.createElement can handle both functions and objects (forwardRef, memo, etc.)
    const Component = IconComponent as React.ComponentType<{ size?: number }>;
    if (!Component) {
      return null;
    }

    // Create element from component (works for both functions and objects)
    const element = React.createElement(Component, { size });

    if (!React.isValidElement(element)) {
      return null;
    }

    return element;
  } catch (error: unknown) {
    // Silently handle rendering errors - return null to show fallback icon
    // This prevents the UI from breaking if an icon fails to render
    // Error handling: gracefully degrade to fallback UI instead of crashing
    // Error is intentionally not logged to avoid console spam
    // Icon rendering failures are non-critical and handled by fallback UI
    if (error instanceof Error) {
      // Type guard to satisfy linter - error is handled by returning null
    }
    return null;
  }
};

// Helper function to render a Duo icon by name (only if name is in validated list)
export const renderDuoIcon = (iconName: string, size = 24): React.ReactElement | null => {
  if (!iconName || typeof iconName !== 'string') {
    return null;
  }

  // Only render if icon name is in our validated list
  if (!DUO_ICON_NAMES.includes(iconName)) {
    return null;
  }

  try {
    // Duo Icons are in the 'icons' object as SVG path strings
    if (!('icons' in DuoIcons) || !DuoIcons.icons) {
      return null;
    }

    const iconsObject = DuoIcons.icons as Record<string, string>;
    const iconKey = iconName;

    // Check if the key exists in the icons object
    if (!(iconKey in iconsObject)) {
      return null;
    }

    const svgPathString = iconsObject[iconKey];

    // Duo icons are SVG path strings, not React components
    // Create an SVG element from the path string
    if (typeof svgPathString !== 'string') {
      return null;
    }

    // Create SVG element from the path string
    // Duo icons use a two-layer system with primary and secondary layers
    return React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
      style: { display: 'inline-block', verticalAlign: 'middle' },
      dangerouslySetInnerHTML: { __html: svgPathString },
    });
  } catch (error: unknown) {
    // Silently handle rendering errors - return null to show fallback icon
    // This prevents the UI from breaking if an icon fails to render
    // Error handling: gracefully degrade to fallback UI instead of crashing
    // Error is intentionally not logged to avoid console spam
    // Icon rendering failures are non-critical and handled by fallback UI
    if (error instanceof Error) {
      // Type guard to satisfy linter - error is handled by returning null
    }
    return null;
  }
};

// Helper function to render icon by library and name
export const renderIcon = (
  library: 'lucide' | 'duo',
  iconName: string,
  size = 24
): React.ReactElement | null => {
  if (library === 'lucide') {
    return renderLucideIcon(iconName, size);
  }
  if (library === 'duo') {
    return renderDuoIcon(iconName, size);
  }
  return null;
};
