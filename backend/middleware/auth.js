const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  // Los tokens se envían en el header "Authorization"
  // con el formato: "Bearer eyJhbGciOiJIUzI1NiIsInR..."
  const authHeader = req.headers['authorization'];

  // Si no hay header, rechazamos la petición
  if (!authHeader) {
    return res.status(401).json({
      error: 'Acceso denegado. No se proporcionó token de autenticación.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Formato de token inválido. Use: Bearer <token>'
    });
  }

  try {
   
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = payload;

    next(); // Continúa al siguiente middleware o controlador
  } catch (error) {
    // JsonWebTokenError: token inválido o manipulado
    // TokenExpiredError: token expirado
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Inicia sesión nuevamente.' });
    }
    return res.status(401).json({ error: 'Token inválido.' });
  }
};

// Middleware que verifica que el usuario sea administrador
const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere rol de administrador.'
    });
  }
  next();
};

module.exports = { verificarToken, soloAdmin };