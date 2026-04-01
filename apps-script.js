// Google Apps Script — AdmSocial Password Reset con JSONP
// Reemplaza TODO el código en script.google.com

function doGet(e) {
  const callback = e.parameter.callback;
  const dataStr = e.parameter.data;
  
  let result;
  try {
    const data = JSON.parse(dataStr);
    const action = data.action;
    if (action === 'send') {
      result = sendCode(data.email);
    } else if (action === 'verify') {
      result = verifyCode(data.email, data.code, data.newPassword);
    } else {
      result = { success: false, error: 'Acción inválida' };
    }
  } catch(err) {
    result = { success: false, error: err.message };
  }
  
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    if (action === 'send') return response(sendCode(data.email));
    if (action === 'verify') return response(verifyCode(data.email, data.code, data.newPassword));
    return response({ success: false, error: 'Acción inválida' });
  } catch(err) {
    return response({ success: false, error: err.message });
  }
}

function sendCode(email) {
  if (!email) return { success: false, error: 'Email requerido' };
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 15 * 60 * 1000;
  
  PropertiesService.getScriptProperties().setProperty(
    'code_' + email,
    JSON.stringify({ code, expiry })
  );
  
  GmailApp.sendEmail(email, '🔐 Código de recuperación — AdmSocial', '', {
    htmlBody: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#f4f5fb;padding:32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:2rem;font-weight:800;color:#6c63ff;">◈ AdmSocial</div>
          <p style="color:#888;margin-top:4px;font-size:0.9rem;">Gestor de Redes Sociales</p>
        </div>
        <div style="background:white;border-radius:12px;padding:28px;text-align:center;">
          <p style="font-size:0.9rem;color:#666;margin-bottom:24px;">Tu código de recuperación es:</p>
          <div style="background:#f4f5fb;border:2px dashed #6c63ff;border-radius:12px;padding:20px;margin:0 auto;width:fit-content;">
            <span style="font-size:2.5rem;font-weight:900;letter-spacing:10px;color:#6c63ff;">${code}</span>
          </div>
          <p style="font-size:0.8rem;color:#999;margin-top:16px;">⏱ Expira en <strong>15 minutos</strong></p>
          <p style="font-size:0.8rem;color:#999;margin-top:8px;">Si no solicitaste esto, ignora este correo.</p>
        </div>
        <p style="text-align:center;font-size:0.75rem;color:#bbb;margin-top:20px;">© 2026 AdmSocial · admsocial.vercel.app</p>
      </div>
    `
  });
  
  return { success: true, message: 'Código enviado' };
}

function verifyCode(email, code, newPassword) {
  if (!email || !code || !newPassword)
    return { success: false, error: 'Datos incompletos' };
  
  const stored = PropertiesService.getScriptProperties().getProperty('code_' + email);
  if (!stored) return { success: false, error: 'Código no encontrado o expirado' };
  
  const parsed = JSON.parse(stored);
  
  if (Date.now() > parsed.expiry) {
    PropertiesService.getScriptProperties().deleteProperty('code_' + email);
    return { success: false, error: 'Código expirado. Solicita uno nuevo.' };
  }
  
  if (code !== parsed.code) return { success: false, error: 'Código incorrecto' };
  
  try {
    const result = UrlFetchApp.fetch('https://admsocial.vercel.app/api/auth/password-reset', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ action: 'reset_direct', email, newPassword }),
      muteHttpExceptions: true
    });
    const resultData = JSON.parse(result.getContentText());
    if (!resultData.success) return { success: false, error: resultData.error || 'Error al actualizar contraseña' };
  } catch(err) {
    return { success: false, error: 'Error al conectar: ' + err.message };
  }
  
  PropertiesService.getScriptProperties().deleteProperty('code_' + email);
  return { success: true };
}

function response(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
