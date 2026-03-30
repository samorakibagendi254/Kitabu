import { Book, Podcast } from '../types/app';
import { apiRequest } from './apiClient';

export async function getLibraryBooks() {
  const payload = await apiRequest<{ books: Book[] }>('/app/library/books', {
    method: 'GET',
  });
  return payload.books;
}

export async function getLearningPodcasts() {
  const payload = await apiRequest<{ podcasts: Podcast[] }>('/app/podcasts', {
    method: 'GET',
  });
  return payload.podcasts;
}
