import { User } from '../models/User';
import firestore from "@react-native-firebase/firestore";
import { EncryptionService } from "./encryptionService";

export class AuthService {
  static async login(matricula: string, pass: string): Promise<User> {
    const matriculaNormalized = matricula.trim();
    const passNormalized = pass.trim();

    // Encriptación de la contraseña recibida
    const encryptedPass = EncryptionService.encrypt(passNormalized);

    try {
      const snapshot = await firestore()
        .collection("usuarios")
        .where("matricula", "==", matriculaNormalized)
        .where("contrasena", "==", encryptedPass)
        .get();

      if (snapshot.empty) {
        throw new Error("Credenciales inválidas");
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      // Guardamos el ID del documento
      return {
        id: doc.id, // ID del documento de Firebase
        nombre: data.nombre,
        apellidos: data.apellidos,
        fechaNac: data.fechaNacimiento,
        sexo: data.sexo,
        telefono: data.telefono,
        matricula: data.matricula,
        email: data.correo,
        contrasena: data.contrasena,
        area: data.area,
        carrera: data.carrera,
        favoritosIds: data.favoritosIds || [], // Array de favoritos
      } as User;

    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async logout(): Promise<void> {
    return Promise.resolve();
  }
}
// import { User } from '../models/User';
// import firestore from "@react-native-firebase/firestore";
// import { EncryptionService } from "./encryptionService";

// export class AuthService {
//   static async login(matricula: string, pass: string): Promise<User> {
//     const matriculaNormalized = matricula.trim();
//     const passNormalized = pass.trim();

//     // Encriptacón de la contraseña recibida
//     const encryptedPass = EncryptionService.encrypt(passNormalized);

//     try {
//       const snapshot = await firestore()
//         .collection("usuarios")
//         .where("matricula", "==", matriculaNormalized)
//         .where("contrasena", "==", encryptedPass)
//         // .where("contrasena", "==", passNormalized)
//         .get();

//       if (snapshot.empty) {
//         throw new Error("Credenciales inválidas");
//       }

//       const doc = snapshot.docs[0];
//       const data = doc.data();

//       return {
//         nombre: data.nombre,
//         apellido: data.apellido,
//         fechaNac: data.fechaNac,
//         sexo: data.sexo,
//         telefono: data.telefono,
//         matricula: data.matricula,
//         email: data.email,
//         contrasena: data.contrasena,
//         area: data.area,
//         carrera: data.carrera,
//       } as User;

//     } catch (error: any) {
//       throw new Error(error.message);
//     }
//   }

//   static async logout(): Promise<void> {
//     return Promise.resolve();
//   }
// }
