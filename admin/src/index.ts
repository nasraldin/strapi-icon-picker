import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { IconPickerIcon } from './components/IconPicker/IconPickerIcon';

export default {
  register(app: any) {
    // Register the custom field
    app.customFields.register({
      name: 'icon-picker',
      pluginId: PLUGIN_ID,
      type: 'string',
      intlLabel: {
        id: getTranslation('customField.label'),
        defaultMessage: 'Icon Picker',
      },
      intlDescription: {
        id: getTranslation('customField.description'),
        defaultMessage: 'Select an icon from Lucide or Duo Icons',
      },
      icon: IconPickerIcon,
      components: {
        Input: async () =>
          import('./components/IconPicker/Input').then((module) => ({
            default: module.default,
          })),
      },
      options: {
        base: [
          {
            sectionTitle: null,
            items: [
              {
                name: 'required',
                type: 'boolean',
                intlLabel: {
                  id: getTranslation('customField.options.required'),
                  defaultMessage: 'Required field',
                },
                description: {
                  id: getTranslation('customField.options.required.description'),
                  defaultMessage: "You won't be able to create an entry if this field is empty",
                },
              },
            ],
          },
        ],
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    const importedTrads = await Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);
          // Prefix all translation keys with plugin ID
          const translationData = data as Record<string, string>;
          const prefixedData = Object.keys(translationData).reduce(
            (acc, key) => {
              acc[`${PLUGIN_ID}.${key}`] = translationData[key];
              return acc;
            },
            {} as Record<string, string>
          );

          return { data: prefixedData, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );

    return importedTrads;
  },
};
