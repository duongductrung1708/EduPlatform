import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  PaginationItem,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FirstPage,
  LastPage
} from '@mui/icons-material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  showItemsPerPage?: boolean;
  showTotalItems?: boolean;
  disabled?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  showItemsPerPage = true,
  showTotalItems = true,
  disabled = false
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: 2,
      p: 2,
      borderTop: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper'
    }}>
      {/* Left side - Items info and per page selector */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        {showTotalItems && (
          <Typography variant="body2" color="text.secondary">
            Hiển thị {startItem}-{endItem} trong tổng số {totalItems} mục
          </Typography>
        )}
        
        {showItemsPerPage && onItemsPerPageChange && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Mục/trang</InputLabel>
            <Select
              value={itemsPerPage}
              label="Mục/trang"
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              disabled={disabled}
            >
              {itemsPerPageOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {/* Right side - Pagination controls */}
      <MuiPagination
        count={totalPages}
        page={currentPage}
        onChange={(_, page) => onPageChange(page)}
        disabled={disabled}
        color="primary"
        size="large"
        showFirstButton
        showLastButton
        renderItem={(item) => (
          <PaginationItem
            {...item}
            slots={{
              previous: KeyboardArrowLeft,
              next: KeyboardArrowRight,
              first: FirstPage,
              last: LastPage,
            }}
          />
        )}
        sx={{
          '& .MuiPaginationItem-root': {
            fontSize: '0.875rem',
            fontWeight: 500,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            },
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }
        }}
      />
    </Box>
  );
}
