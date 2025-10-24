import { Book } from './Book';

export interface Loan {
    id: string;
    userId: string;
    bookId: string;
    bookData: Book;  // ✅ Object con los datos del libro
    fechaSolicitud: Date;
    fechaRecogida: Date;
    fechaEntrega: Date;
    fechaDevolucion?: Date;
    estado: 'activo' | 'expirado' | 'entregado' | 'cancelado';
    diasRestantes: number;
    activo: boolean;
}

// Tipo para crear un nuevo préstamo (sin id)
export interface NewLoan {
    userId: string;
    bookId: string;
    bookData: Book;
    fechaSolicitud: Date;
    fechaRecogida: Date;
    fechaEntrega: Date;
    estado: 'activo';
    diasRestantes: number;
    activo: boolean;
}