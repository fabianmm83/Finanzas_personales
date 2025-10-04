// functions/src/routes/auth.js
const bcrypt = require('bcryptjs');

exports.register = functions.https.onCall(async (data) => {
    const { username, email, password } = data;
    
    try {
        // Verificar si el usuario ya existe
        const existingUser = await admin.firestore()
            .collection('users')
            .where('email', '==', email)
            .get();
            
        if (!existingUser.empty) {
            throw new functions.https.HttpsError('already-exists', 'Este email ya está registrado');
        }
        
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Crear usuario en Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: username
        });
        
        // Crear documento en Firestore
        const user = new User({
            username,
            email,
            hashedPassword,
            isAdmin: false
        });
        
        await admin.firestore()
            .collection('users')
            .doc(userRecord.uid)
            .set(user.toFirestore());
            
        return { 
            success: true, 
            message: 'Registro exitoso', 
            userId: userRecord.uid 
        };
        
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.login = functions.https.onCall(async (data) => {
    const { email, password } = data;
    
    try {
        // Buscar usuario por email
        const userSnapshot = await admin.firestore()
            .collection('users')
            .where('email', '==', email)
            .get();
            
        if (userSnapshot.empty) {
            throw new functions.https.HttpsError('not-found', 'Credenciales inválidas');
        }
        
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        
        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, userData.hashedPassword);
        if (!isValidPassword) {
            throw new functions.https.HttpsError('unauthenticated', 'Credenciales inválidas');
        }
        
        // Actualizar último login
        await admin.firestore()
            .collection('users')
            .doc(userDoc.id)
            .update({
                lastLogin: admin.firestore.FieldValue.serverTimestamp()
            });
            
        // Generar token personalizado si es necesario
        const token = await admin.auth().createCustomToken(userDoc.id);
        
        return {
            success: true,
            message: 'Inicio de sesión exitoso',
            token: token,
            user: {
                id: userDoc.id,
                username: userData.username,
                email: userData.email
            }
        };
        
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});