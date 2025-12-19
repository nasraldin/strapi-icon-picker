import React, { useState, useMemo } from 'react';
import { Box, Button, Field, Flex, Modal, Typography } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getLucideIconNames, getDuoIconNames, renderIcon } from './iconHelpers';
import { getTranslation } from '../../utils/getTranslation';

interface IconPickerInputProps {
  name: string;
  onChange: (value: { target: { name: string; value: string; type: string } }) => void;
  value?: string;
  attribute: {
    type: string;
    required?: boolean;
  };
  intlLabel?: {
    id: string;
    defaultMessage?: string;
  };
  error?: string;
  description?: {
    id: string;
    defaultMessage?: string;
  };
  disabled?: boolean;
}

// Minimal debug version - just text, no icons, no modal
const IconPickerInput: React.FC<IconPickerInputProps> = ({
  name,
  onChange,
  value = '',
  attribute,
  intlLabel,
  error,
  description,
  disabled = false,
}) => {
  const { formatMessage, locale } = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'lucide' | 'duo'>('lucide');
  const [visibleIconsCount, setVisibleIconsCount] = useState(100); // Initial load count
  const gridRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check if current locale is RTL (Arabic)
  const isRTL = locale === 'ar';

  // Reset visible count when tab or search changes
  React.useEffect(() => {
    setVisibleIconsCount(100);
  }, [activeTab, searchQuery]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Extract nested ternary for label
  let label = formatMessage({
    id: getTranslation('customField.label'),
    defaultMessage: 'Icon Picker',
  });
  if (intlLabel?.defaultMessage) {
    label = intlLabel.defaultMessage;
  } else if (intlLabel?.id) {
    label = formatMessage({
      id: intlLabel.id,
      defaultMessage: formatMessage({
        id: getTranslation('customField.label'),
        defaultMessage: 'Icon Picker',
      }),
    });
  }

  // Extract nested ternary for hint
  let hint: string | undefined;
  if (description?.defaultMessage) {
    hint = description.defaultMessage;
  } else if (description?.id) {
    hint = formatMessage({ id: description.id, defaultMessage: '' });
  }

  // Get icon names
  const lucideIconNames = useMemo(() => {
    return getLucideIconNames();
  }, []);

  const duoIconNames = useMemo(() => {
    return getDuoIconNames();
  }, []);

  // Filter icons based on search
  const filteredLucideIcons = useMemo(() => {
    if (!searchQuery) return lucideIconNames;
    return lucideIconNames.filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, lucideIconNames]);

  const filteredDuoIcons = useMemo(() => {
    if (!searchQuery) return duoIconNames;
    return duoIconNames.filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, duoIconNames]);

  // Get visible icons based on pagination
  // Only use lazy loading for large lists (more than 100 icons)
  const visibleLucideIcons = useMemo(() => {
    if (filteredLucideIcons.length <= 100) {
      return filteredLucideIcons;
    }
    return filteredLucideIcons.slice(0, visibleIconsCount);
  }, [filteredLucideIcons, visibleIconsCount]);

  const visibleDuoIcons = useMemo(() => {
    // Duo icons are only ~91, so no need for lazy loading
    return filteredDuoIcons;
  }, [filteredDuoIcons]);

  // Handler for intersection observer callback
  const handleIntersection = React.useCallback(
    (entries: IntersectionObserverEntry[], maxIcons: number) => {
      const entry = entries[0];
      if (!entry.isIntersecting) {
        return;
      }

      setVisibleIconsCount((prev) => {
        if (prev < maxIcons) {
          return Math.min(prev + 100, maxIcons);
        }
        return prev;
      });
    },
    []
  );

  // Use Intersection Observer for lazy loading
  React.useEffect(() => {
    if (activeTab !== 'lucide' || filteredLucideIcons.length <= 100) {
      return;
    }

    let observer: IntersectionObserver | null = null;
    const maxIcons = filteredLucideIcons.length;

    // Wait a bit for DOM to be ready
    const timeoutId = setTimeout(() => {
      const loadMoreElement = loadMoreRef.current;
      const gridElement = gridRef.current;

      if (!loadMoreElement || !gridElement) {
        return;
      }

      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        handleIntersection(entries, maxIcons);
      };

      observer = new IntersectionObserver(observerCallback, {
        root: gridElement,
        rootMargin: '100px',
        threshold: 0.01,
      });

      observer.observe(loadMoreElement);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [activeTab, filteredLucideIcons.length, visibleLucideIcons.length, handleIntersection]);

  // Handle scroll to load more icons (only for Lucide with many icons)
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      // Only lazy load for Lucide icons when there are more than 100
      if (activeTab !== 'lucide' || filteredLucideIcons.length <= 100) {
        return;
      }

      const target = e.currentTarget;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;

      // Load more when user scrolls near bottom (within 500px)
      if (scrollBottom < 500) {
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Throttle scroll events
        scrollTimeoutRef.current = setTimeout(() => {
          setVisibleIconsCount((prev) => {
            const maxIcons = filteredLucideIcons.length;
            if (prev < maxIcons) {
              // Load 100 more icons
              const newCount = Math.min(prev + 100, maxIcons);
              return newCount;
            }
            return prev;
          });
          scrollTimeoutRef.current = null;
        }, 200);
      }
    },
    [activeTab, filteredLucideIcons.length]
  );

  const handleIconSelect = (library: 'lucide' | 'duo', iconName: string) => {
    onChange({
      target: {
        name,
        value: `${library}:${iconName}`,
        type: attribute.type,
      },
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange({
      target: {
        name,
        value: '',
        type: attribute.type,
      },
    });
  };

  // Parse the current value to get library and icon name
  const currentValue = useMemo(() => {
    if (!value) return { library: null, iconName: null };
    const parts = value.split(':');
    if (parts.length === 2) {
      return { library: parts[0] as 'lucide' | 'duo', iconName: parts[1] };
    }
    return { library: null, iconName: null };
  }, [value]);

  return (
    <Field.Root error={error} name={name} hint={hint} required={attribute.required}>
      <Flex direction="column" alignItems="stretch" gap={2}>
        <Flex gap={2} alignItems="flex-end">
          <Box flex="1">
            <Field.Label>{label}</Field.Label>
            {value && currentValue.library && currentValue.iconName && (
              <Box
                padding={3}
                background="neutral0"
                borderRadius="4px"
                marginTop={2}
                style={{
                  border: '1px solid',
                  borderColor: 'var(--strapi-neutral-200)',
                }}
              >
                <Flex alignItems="center" gap={3}>
                  <Box
                    padding={2}
                    background="neutral100"
                    borderRadius="4px"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: 'var(--strapi-neutral-200)',
                    }}
                  >
                    {renderIcon(currentValue.library, currentValue.iconName, 28) ?? (
                      <Box
                        width={28}
                        height={28}
                        background="neutral200"
                        borderRadius="2px"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          variant="pi"
                          textColor="neutral600"
                          style={{ fontSize: '10px' }}
                        >
                          ?
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box flex="1">
                    <Typography variant="pi" textColor="neutral600" marginTop={1}>
                      {currentValue.library === 'lucide'
                        ? formatMessage({
                            id: getTranslation('component.library.lucide'),
                            defaultMessage: 'Lucide',
                          })
                        : formatMessage({
                            id: getTranslation('component.library.duo'),
                            defaultMessage: 'Duo',
                          })}
                    </Typography>
                    <Typography variant="pi" textColor="neutral800">
                      {currentValue.iconName}
                    </Typography>
                  </Box>
                  <Flex gap={1}>
                    <Button variant="tertiary" size="S" onClick={handleClear} disabled={disabled}>
                      <Cross />
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            )}
            {!value && (
              <Typography variant="pi" textColor="neutral600">
                {formatMessage({
                  id: getTranslation('component.noIconSelected'),
                  defaultMessage: 'No icon selected',
                })}
              </Typography>
            )}
          </Box>
          <Button
            variant="secondary"
            onClick={() => setIsOpen(true)}
            disabled={disabled}
            style={{ marginBottom: '4px' }}
          >
            {value
              ? formatMessage({
                  id: getTranslation('component.changeIcon'),
                  defaultMessage: 'Change Icon',
                })
              : formatMessage({
                  id: getTranslation('component.selectIcon'),
                  defaultMessage: 'Select Icon',
                })}
          </Button>
        </Flex>

        {isOpen && Modal && (
          <Modal.Root open={isOpen} onOpenChange={setIsOpen}>
            <Modal.Content>
              <Modal.Header
                closeLabel={formatMessage({
                  id: getTranslation('component.modal.closeDialog'),
                  defaultMessage: 'Close dialog',
                })}
              >
                <Modal.Title>
                  {formatMessage({
                    id: getTranslation('component.modal.title'),
                    defaultMessage: 'Select an Icon',
                  })}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Flex direction="column" gap={4} style={{ width: '100%', height: '100%' }}>
                  {/* Simple search input */}
                  <Box style={{ width: '100%', padding: '0 8px' }}>
                    <input
                      type="text"
                      placeholder={formatMessage({
                        id: getTranslation('component.modal.searchPlaceholder'),
                        defaultMessage: 'Search icons...',
                      })}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        direction: isRTL ? 'rtl' : 'ltr',
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    />
                  </Box>

                  {/* Simple tabs */}
                  <Box
                    paddingX={3}
                    paddingTop={2}
                    paddingBottom={2}
                    style={{ width: '100%', padding: '0 8px' }}
                  >
                    <Flex gap={2} marginBottom={2}>
                      <Button
                        variant={activeTab === 'lucide' ? 'secondary' : 'tertiary'}
                        onClick={() => setActiveTab('lucide')}
                      >
                        {formatMessage({
                          id: getTranslation('component.modal.lucide'),
                          defaultMessage: 'Lucide',
                        })}{' '}
                        ({filteredLucideIcons.length})
                      </Button>
                      <Button
                        variant={activeTab === 'duo' ? 'secondary' : 'tertiary'}
                        onClick={() => setActiveTab('duo')}
                      >
                        {formatMessage({
                          id: getTranslation('component.modal.duo'),
                          defaultMessage: 'Duo',
                        })}{' '}
                        ({filteredDuoIcons.length})
                      </Button>
                    </Flex>
                  </Box>

                  {/* Icon grid - show all icons */}
                  {(() => {
                    // Render Lucide icons
                    if (activeTab === 'lucide') {
                      if (filteredLucideIcons.length > 0) {
                        return (
                          <div
                            ref={gridRef}
                            onScroll={handleScroll}
                            style={{
                              flex: '1',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                              gap: '8px',
                              width: '100%',
                              padding: '0 8px',
                              margin: '0',
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              boxSizing: 'border-box',
                            }}
                          >
                            {visibleLucideIcons.map((iconName) => {
                              const iconElement = renderIcon('lucide', iconName, 24);
                              const fallbackIcon = (
                                <Box
                                  width={24}
                                  height={24}
                                  background="neutral200"
                                  borderRadius="2px"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Typography
                                    variant="pi"
                                    textColor="neutral600"
                                    style={{ fontSize: '10px' }}
                                  >
                                    ?
                                  </Typography>
                                </Box>
                              );
                              return (
                                <Button
                                  key={`lucide-${iconName}`}
                                  variant="tertiary"
                                  onClick={() => handleIconSelect('lucide', iconName)}
                                  style={{
                                    minHeight: '90px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    gap: '6px',
                                    padding: '12px 8px 8px 8px',
                                  }}
                                >
                                  <Box
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      minHeight: '32px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {iconElement ?? fallbackIcon}
                                  </Box>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      textAlign: 'center',
                                      wordBreak: 'break-word',
                                      lineHeight: '1.2',
                                      marginTop: 'auto',
                                    }}
                                  >
                                    {iconName}
                                  </span>
                                </Button>
                              );
                            })}
                            {/* Show loading indicator and load more button if more icons are available */}
                            {visibleLucideIcons.length < filteredLucideIcons.length && (
                              <Box
                                ref={loadMoreRef}
                                style={{
                                  gridColumn: '1 / -1',
                                  padding: '16px',
                                  textAlign: 'center',
                                  minHeight: '50px',
                                }}
                              >
                                <Flex direction="column" gap={2} alignItems="center">
                                  <Typography variant="pi" textColor="neutral600">
                                    {formatMessage(
                                      {
                                        id: getTranslation('component.modal.loadingMore'),
                                        defaultMessage:
                                          'Loading more icons... ({visible} of {total})',
                                      },
                                      {
                                        visible: visibleLucideIcons.length,
                                        total: filteredLucideIcons.length,
                                      }
                                    )}
                                  </Typography>
                                  <Button
                                    variant="secondary"
                                    size="S"
                                    onClick={() => {
                                      setVisibleIconsCount((prev) => {
                                        const maxIcons = filteredLucideIcons.length;
                                        return Math.min(prev + 100, maxIcons);
                                      });
                                    }}
                                  >
                                    {formatMessage({
                                      id: getTranslation('component.modal.loadMore'),
                                      defaultMessage: 'Load More',
                                    })}
                                  </Button>
                                </Flex>
                              </Box>
                            )}
                          </div>
                        );
                      }
                      return (
                        <Box
                          padding={4}
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            direction: isRTL ? 'rtl' : 'ltr',
                          }}
                        >
                          <Flex direction="column" gap={2} alignItems="center">
                            <Typography
                              textColor="neutral600"
                              style={{
                                direction: isRTL ? 'rtl' : 'ltr',
                                textAlign: 'center',
                              }}
                            >
                              {formatMessage(
                                {
                                  id: getTranslation('component.modal.noResults'),
                                  defaultMessage: 'No {library} icons found matching "{query}"',
                                },
                                {
                                  library: formatMessage({
                                    id: getTranslation('component.modal.lucide'),
                                    defaultMessage: 'Lucide',
                                  }),
                                  query: searchQuery,
                                }
                              )}
                            </Typography>
                            <Typography
                              variant="pi"
                              textColor="neutral500"
                              style={{
                                direction: isRTL ? 'rtl' : 'ltr',
                                textAlign: 'center',
                              }}
                            >
                              {formatMessage(
                                {
                                  id: getTranslation('component.modal.totalAvailable'),
                                  defaultMessage: 'Total available: {count} icons',
                                },
                                { count: lucideIconNames.length }
                              )}
                            </Typography>
                          </Flex>
                        </Box>
                      );
                    }

                    // Render Duo icons
                    if (filteredDuoIcons.length > 0) {
                      return (
                        <Box
                          ref={gridRef}
                          onScroll={handleScroll}
                          style={{
                            flex: '1',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                            gap: '8px',
                            width: '100%',
                            padding: '0 8px',
                            margin: '0',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            boxSizing: 'border-box',
                          }}
                        >
                          {visibleDuoIcons.map((iconName) => {
                            const iconElement = renderIcon('duo', iconName, 24);
                            const fallbackIcon = (
                              <Box
                                width={24}
                                height={24}
                                background="neutral200"
                                borderRadius="2px"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography
                                  variant="pi"
                                  textColor="neutral600"
                                  style={{ fontSize: '10px' }}
                                >
                                  ?
                                </Typography>
                              </Box>
                            );
                            return (
                              <Button
                                key={`duo-${iconName}`}
                                variant="tertiary"
                                onClick={() => handleIconSelect('duo', iconName)}
                                style={{
                                  minHeight: '90px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  gap: '6px',
                                  padding: '12px 8px 8px 8px',
                                }}
                              >
                                <Box
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '32px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {iconElement ?? fallbackIcon}
                                </Box>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    textAlign: 'center',
                                    wordBreak: 'break-word',
                                    lineHeight: '1.2',
                                    marginTop: 'auto',
                                  }}
                                >
                                  {iconName}
                                </span>
                              </Button>
                            );
                          })}
                        </Box>
                      );
                    }

                    return (
                      <Box
                        padding={4}
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          direction: isRTL ? 'rtl' : 'ltr',
                        }}
                      >
                        <Flex direction="column" gap={2} alignItems="center">
                          <Typography
                            textColor="neutral600"
                            style={{
                              direction: isRTL ? 'rtl' : 'ltr',
                              textAlign: 'center',
                            }}
                          >
                            {formatMessage(
                              {
                                id: getTranslation('component.modal.noResults'),
                                defaultMessage: 'No {library} icons found matching "{query}"',
                              },
                              {
                                library: formatMessage({
                                  id: getTranslation('component.modal.duo'),
                                  defaultMessage: 'Duo',
                                }),
                                query: searchQuery,
                              }
                            )}
                          </Typography>
                          <Typography
                            variant="pi"
                            textColor="neutral500"
                            style={{
                              direction: isRTL ? 'rtl' : 'ltr',
                              textAlign: 'center',
                            }}
                          >
                            {formatMessage(
                              {
                                id: getTranslation('component.modal.totalAvailable'),
                                defaultMessage: 'Total available: {count} icons',
                              },
                              { count: duoIconNames.length }
                            )}
                          </Typography>
                        </Flex>
                      </Box>
                    );
                  })()}
                </Flex>
              </Modal.Body>
              <Modal.Footer>
                <Modal.Close>
                  <Button variant="tertiary">
                    {formatMessage({
                      id: getTranslation('component.modal.cancel'),
                      defaultMessage: 'Cancel',
                    })}
                  </Button>
                </Modal.Close>
              </Modal.Footer>
            </Modal.Content>
          </Modal.Root>
        )}
      </Flex>
    </Field.Root>
  );
};

export default IconPickerInput;
