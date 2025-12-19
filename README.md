# Strapi Icon Picker

A custom field plugin for Strapi v5 that allows content editors to easily select icons from [Lucide Icons](https://lucide.dev/) and [Duo Icons](https://duoicons.com/) libraries.

## Features

- 🎨 **Two Icon Libraries**: Access to 3,800+ Lucide icons and 90+ Duo icons
- 🔍 **Search Functionality**: Quickly find icons by name
- 🌐 **Internationalization**: Full support for English and Arabic (RTL)
- ⚡ **Performance Optimized**: Lazy loading for large icon sets
- 🎯 **User-Friendly**: Modern, intuitive interface with visual icon preview
- 📱 **Responsive**: Works seamlessly in the Strapi admin panel

## Installation

### Using npm

```bash
npm install strapi-plugin-icon-picker
```

### Using yarn

```bash
yarn add strapi-plugin-icon-picker
```

### Using pnpm

```bash
pnpm add strapi-plugin-icon-picker
```

> **Note**: Replace `strapi-plugin-icon-picker` with your actual npm package name when published.

## Configuration

After installation, register the plugin in your Strapi configuration file:

**File: `config/plugins.ts`**

```typescript
export default () => ({
  'icon-picker': {
    enabled: true,
    resolve: './node_modules/strapi-plugin-icon-picker',
  },
});
```

> **Note**: Replace `strapi-plugin-icon-picker` with your actual npm package name when published.

Or if you're using a local development version:

```typescript
export default () => ({
  'icon-picker': {
    enabled: true,
    resolve: './src/plugins/icon-picker',
  },
});
```

## Usage

### In Content Types

Add the `icon-picker` custom field to any content type or component schema:

**Example: `src/components/sections/card.json`**

```json
{
  "collectionName": "components_sections_cards",
  "info": {
    "name": "card",
    "displayName": "Card",
    "description": "A card component with icon support"
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "icon": {
      "type": "customField",
      "customField": "plugin::icon-picker.icon-picker",
      "required": false
    }
  }
}
```

### In Collection Types

**Example: `src/api/feature/content-types/feature/schema.json`**

```json
{
  "kind": "collectionType",
  "collectionName": "features",
  "info": {
    "singularName": "feature",
    "pluralName": "features",
    "displayName": "Feature"
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "icon": {
      "type": "customField",
      "customField": "plugin::icon-picker.icon-picker",
      "required": false
    }
  }
}
```

## Data Format

The icon picker stores icon data in the following format:

```
library:iconName
```

**Examples:**

- `lucide:Home` - Lucide Home icon
- `duo:add_circle` - Duo add_circle icon

## Frontend Usage

When consuming the API, you'll receive the icon value as a string in the format `library:iconName`. You can parse this and render the appropriate icon:

### React Example

```typescript
import { Home, Heart } from 'lucide-react';
import DuoIcons from 'duo-icons';

function IconRenderer({ iconValue }: { iconValue: string }) {
  if (!iconValue) return null;

  const [library, iconName] = iconValue.split(':');

  if (library === 'lucide') {
    // Dynamically import Lucide icons
    const IconComponent = require(`lucide-react`)[iconName];
    return IconComponent ? <IconComponent /> : null;
  }

  if (library === 'duo') {
    // Render Duo icon
    const IconSvg = DuoIcons.icons[iconName];
    if (IconSvg) {
      return <div dangerouslySetInnerHTML={{ __html: IconSvg }} />;
    }
  }

  return null;
}
```

### Next.js Example

```typescript
import { Home } from 'lucide-react';

export default function FeatureCard({ feature }) {
  const [library, iconName] = feature.icon?.split(':') || [];

  return (
    <div>
      {library === 'lucide' && iconName === 'Home' && <Home />}
      <h3>{feature.name}</h3>
    </div>
  );
}
```

## API Response

The icon field will be included in your API responses:

```json
{
  "data": {
    "id": 1,
    "attributes": {
      "title": "My Feature",
      "icon": "lucide:Home",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Supported Languages

The plugin includes translations for:

- 🇺🇸 English (en)
- 🇸🇦 Arabic (ar) - with RTL support

Additional languages can be added by contributing translation files.

## Requirements

- Strapi v5.0.0 or higher
- Node.js 18.x or higher

## Development

### Local Development Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd strapi-plugin-icon-picker
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Build the plugin:

```bash
npm run build
# or
yarn build
```

4. Link the plugin for development:

```bash
npm run watch:link
# or
yarn watch:link
```

5. In your Strapi project, configure the plugin to use the local version:

```typescript
// config/plugins.ts
export default () => ({
  'icon-picker': {
    enabled: true,
    resolve: './src/plugins/icon-picker',
  },
});
```

### Building for Production

```bash
npm run build
```

This will create the `dist` folder with the compiled plugin ready for npm publishing.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Nasr Aldin

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.
