import { Book } from "../models/Book";

export type RootStackParamList = {
  Login: undefined;
  Books: undefined;
  BookInfo: {item: Book};
  Favorites: undefined;
  Recommended: undefined;
  Loans: undefined;
  ApplyLoan: { book: Book };
  Payments?: undefined;
  Notifications?: undefined;
  Profile: undefined;
  ChangePassword: undefined;

  BookDetails: { bookId: string };
};
