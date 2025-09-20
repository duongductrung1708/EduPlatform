import React, { useState } from 'react';
import { Box, TextField, Grid, Button, MenuItem, Typography, Stack } from '@mui/material';
import { coursesApi } from '../api/courses';
import { useNavigate } from 'react-router-dom';

const categories = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Tin học', 'Mỹ thuật', 'Âm nhạc'];
const levels = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];

export default function CreatePublicCoursePage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [tags, setTags] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const payload = {
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description,
      category,
      level,
      visibility: 'public' as const,
      status: 'published' as const,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    };
    const created = await coursesApi.createPublic(payload);
    navigate(`/courses/${created._id}`);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Tạo khóa học công khai</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} helperText="Tự tạo nếu để trống" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={3} label="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select fullWidth label="Danh mục" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select fullWidth label="Cấp lớp" value={level} onChange={(e) => setLevel(e.target.value)}>
            {levels.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Tags (phân cách bằng dấu phẩy)" value={tags} onChange={(e) => setTags(e.target.value)} />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSubmit} disabled={!title || !description || !category || !level}>Tạo khóa học</Button>
        <Button variant="text" onClick={() => navigate(-1)}>Hủy</Button>
      </Stack>
    </Box>
  );
}


