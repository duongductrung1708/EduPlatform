import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Typography,
  Button,
  Collapse,
  Divider
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  Sort,
} from '@mui/icons-material';

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SortOption {
  value: string;
  label: string;
  direction?: 'asc' | 'desc';
}

export interface SearchFilterBarProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filters
  filters?: {
    [key: string]: {
      value: string;
      options: FilterOption[];
      label: string;
      icon?: React.ReactNode;
    };
  };
  onFilterChange: (filterKey: string, value: string) => void;
  
  // Sort
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  
  // UI
  showAdvancedFilters?: boolean;
  onToggleAdvanced?: () => void;
  onClearAll?: () => void;
  
  // Styling
  variant?: 'default' | 'compact' | 'minimal';
  elevation?: number;
  sx?: React.CSSProperties | Record<string, unknown>;
}

export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  filters = {},
  onFilterChange,
  sortOptions = [],
  sortValue,
  onSortChange,
  onToggleAdvanced,
  onClearAll,
  variant = 'default',
  elevation = 1,
  sx = {}
}: SearchFilterBarProps) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchValue, onSearchChange]);

  // Sync with external search value
  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  const handleClearSearch = () => {
    setLocalSearchValue('');
    onSearchChange('');
  };

  const handleToggleAdvanced = () => {
    setAdvancedOpen(!advancedOpen);
    onToggleAdvanced?.();
  };

  const handleClearAll = () => {
    setLocalSearchValue('');
    onSearchChange('');
    onClearAll?.();
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter.value !== '');
  const hasActiveSearch = localSearchValue.trim() !== '';

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          p: 2,
          gap: 1.5
        };
      case 'minimal':
        return {
          p: 1.5,
          gap: 1
        };
      default:
        return {
          p: 3,
          gap: 2
        };
    }
  };

  return (
    <Paper 
      elevation={elevation}
      sx={{
        borderRadius: 3,
        background: isDark
          ? 'linear-gradient(135deg, #111827 0%, #0B1220 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
        border: isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(239, 91, 91, 0.1)',
        ...sx
      }}
    >
      <Box sx={getVariantStyles()}>
        {/* Main Search and Filter Row */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          {/* Search Field */}
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            value={localSearchValue}
            onChange={(e) => setLocalSearchValue(e.target.value)}
            size={variant === 'compact' ? 'small' : 'medium'}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(239, 91, 91, 0.05)',
                '& fieldset': {
                  border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(239, 91, 91, 0.2)'
                },
                '&:hover fieldset': {
                  border: isDark ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(239, 91, 91, 0.3)'
                },
                '&.Mui-focused fieldset': {
                  border: isDark ? '1px solid #FCA5A5' : '1px solid #EF5B5B'
                }
              },
              '& .MuiInputBase-input': {
                color: isDark ? '#F3F4F6' : undefined
              },
              '& .MuiInputBase-input::placeholder': {
                color: isDark ? 'rgba(243,244,246,0.7)' : undefined,
                opacity: 1
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: isDark ? '#FCA5A5' : '#EF5B5B' }} />
                </InputAdornment>
              ),
              endAdornment: hasActiveSearch && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    sx={{ color: isDark ? '#FCA5A5' : '#EF5B5B' }}
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
              
            }}
          />

          {/* Quick Filters */}
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' }
            }}
          >
            {Object.entries(filters).slice(0, 2).map(([key, filter]) => (
              <FormControl 
                key={key}
                size={variant === 'compact' ? 'small' : 'medium'}
                sx={{ minWidth: 120 }}
              >
                <InputLabel sx={{ color: isDark ? '#E5E7EB' : undefined }}>{filter.label}</InputLabel>
                <Select
                  value={filter.value}
                  label={filter.label}
                  onChange={(e) => onFilterChange(key, e.target.value)}
                  startAdornment={filter.icon}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(239, 91, 91, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(239, 91, 91, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? '#FCA5A5' : '#EF5B5B',
                    }
                  }}
                >
                  <MenuItem value="">
                    <em style={{ color: isDark ? '#E5E7EB' : undefined }}>Tất cả</em>
                  </MenuItem>
                  {filter.options.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ color: isDark ? '#E5E7EB' : undefined }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {option.icon}
                        <span>{option.label}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

            {/* Sort */}
            {sortOptions.length > 0 && onSortChange && (
              <FormControl 
                size={variant === 'compact' ? 'small' : 'medium'}
                sx={{ minWidth: 120 }}
              >
                <InputLabel sx={{ color: isDark ? '#E5E7EB' : undefined }}>Sắp xếp</InputLabel>
                <Select
                  value={sortValue || ''}
                  label="Sắp xếp"
                  onChange={(e) => onSortChange(e.target.value)}
                  startAdornment={<Sort sx={{ color: isDark ? '#FCA5A5' : '#EF5B5B', mr: 1 }} />}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(239, 91, 91, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(239, 91, 91, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? '#FCA5A5' : '#EF5B5B',
                    }
                  }}
                >
                  <MenuItem value="">
                    <em style={{ color: isDark ? '#E5E7EB' : undefined }}>Mặc định</em>
                  </MenuItem>
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ color: isDark ? '#E5E7EB' : undefined }}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Advanced Filters Toggle */}
            {Object.keys(filters).length > 2 && (
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                endIcon={advancedOpen ? <ExpandLess /> : <ExpandMore />}
                onClick={handleToggleAdvanced}
                size={variant === 'compact' ? 'small' : 'medium'}
                sx={{
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(239, 91, 91, 0.3)',
                  color: isDark ? '#E5E7EB' : '#EF5B5B',
                  '&:hover': {
                    borderColor: isDark ? '#E5E7EB' : '#EF5B5B',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(239, 91, 91, 0.05)',
                  }
                }}
              >
                Bộ lọc
              </Button>
            )}

            {/* Clear All */}
            {(hasActiveFilters || hasActiveSearch) && onClearAll && (
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClearAll}
                size={variant === 'compact' ? 'small' : 'medium'}
                sx={{
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(239, 91, 91, 0.3)',
                  color: isDark ? '#E5E7EB' : '#EF5B5B',
                  '&:hover': {
                    borderColor: isDark ? '#E5E7EB' : '#EF5B5B',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(239, 91, 91, 0.05)',
                  }
                }}
              >
                Xóa tất cả
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Advanced Filters */}
        {Object.keys(filters).length > 2 && (
          <Collapse in={advancedOpen}>
            <Divider sx={{ my: 2, borderColor: 'rgba(239, 91, 91, 0.1)' }} />
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              flexWrap="wrap"
            >
              {Object.entries(filters).slice(2).map(([key, filter]) => (
                <FormControl 
                  key={key}
                  size={variant === 'compact' ? 'small' : 'medium'}
                  sx={{ minWidth: 150 }}
                >
                  <InputLabel>{filter.label}</InputLabel>
                  <Select
                    value={filter.value}
                    label={filter.label}
                    onChange={(e) => onFilterChange(key, e.target.value)}
                    startAdornment={filter.icon}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(239, 91, 91, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(239, 91, 91, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EF5B5B',
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Tất cả</em>
                    </MenuItem>
                    {filter.options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {option.icon}
                          <span>{option.label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Stack>
          </Collapse>
        )}

        {/* Active Filters Display */}
        {(hasActiveFilters || hasActiveSearch) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Bộ lọc đang áp dụng:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {hasActiveSearch && (
                <Chip
                  label={`Tìm kiếm: "${localSearchValue}"`}
                  onDelete={handleClearSearch}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(239, 91, 91, 0.1)',
                    color: '#EF5B5B',
                    '& .MuiChip-deleteIcon': {
                      color: '#EF5B5B',
                    }
                  }}
                />
              )}
              {Object.entries(filters).map(([key, filter]) => {
                if (!filter.value) return null;
                const selectedOption = filter.options.find(opt => opt.value === filter.value);
                return (
                  <Chip
                    key={key}
                    label={`${filter.label}: ${selectedOption?.label || filter.value}`}
                    onDelete={() => onFilterChange(key, '')}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(239, 91, 91, 0.1)',
                      color: '#EF5B5B',
                      '& .MuiChip-deleteIcon': {
                        color: '#EF5B5B',
                      }
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
