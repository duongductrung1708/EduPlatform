import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, TextField, Chip, Stack, Pagination, CardActionArea } from '@mui/material';
import { coursesApi, CourseItem } from '../api/courses';
import { useNavigate } from 'react-router-dom';

export default function PublicCoursesPage() {
  const [items, setItems] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await coursesApi.listPublic(page, 12, search);
      setItems(res.items);
      setTotalPages(res.totalPages);
    }, 250);
    return () => clearTimeout(t);
  }, [search, page]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Môn học công khai</Typography>
      <TextField
        placeholder="Tìm kiếm môn học..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: { xs: '100%', sm: 360 } }}
      />
      <Grid container spacing={2}>
        {items.map((c) => (
          <Grid key={c._id} item xs={12} sm={6} md={4} lg={3}>
            <Card>
              <CardActionArea onClick={() => navigate(`/courses/${c._id}`)}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>{c.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                    {c.description}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {c.category && <Chip size="small" label={c.category} />}
                    {c.level && <Chip size="small" label={c.level} />}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
        </Box>
      )}
    </Box>
  );
}


