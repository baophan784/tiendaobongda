import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, Typography, Box, TablePagination } from '@mui/material';
import { useDebounce } from 'use-debounce';

function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm] = useDebounce(searchInput, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    const q = query(collection(db, 'users'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(usersData);
  };

  const handleLogin = () => {
    if (username === 'admin2025' && password === 'admin2025') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  const handleTypeChange = async (id, newType) => {
    const userDoc = doc(db, 'users', id);
    await updateDoc(userDoc, { type: newType });

    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === id ? { ...user, type: newType } : user
      )
    );
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Bạn có chắc muốn xóa lính này không?');
    if (!confirmDelete) return;

    const userDoc = doc(db, 'users', id);
    await deleteDoc(userDoc);

    setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ padding: 4 }}>
      {!isAuthenticated ? (
        <Box sx={{ maxWidth: 400, margin: 'auto', textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>Admin Login</Typography>
          <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth margin="normal" />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth margin="normal" />
          <Button variant="contained" color="primary" onClick={handleLogin} fullWidth>Login</Button>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">Quản lý lính</Typography>
            <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
          </Box>

          <TextField
            label="Tìm tên lính"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            fullWidth
            margin="normal"
          />

          <TableContainer component={Paper} sx={{ marginTop: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><b>Username</b></TableCell>
                  <TableCell><b>Contact</b></TableCell>
                  <TableCell><b>Type</b></TableCell>
                  <TableCell><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(user => (
                  <TableRow
                    key={user.id}
                    hover
                    selected={selectedUserId === user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': { backgroundColor: '#e0f7fa' },
                      '&:hover': { backgroundColor: '#f1f1f1' },
                    }}
                  >
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.contact}</TableCell>
                    <TableCell>
                      <Select
                        value={user.type}
                        onChange={(e) => handleTypeChange(user.id, e.target.value)}
                        size="small"
                        sx={{ width: 160 }} // Cố định chỉ 140px thôi
                      >
                        <MenuItem value={0}>Chưa kích hoạt</MenuItem>
                        <MenuItem value={1}>Đã kích hoạt</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // Không trigger chọn dòng
                          handleDelete(user.id);
                        }}
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}
    </Box>
  );
}

export default Admin;
