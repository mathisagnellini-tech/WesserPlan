import { api } from '@/lib/apiClient';
import type { MyFundraiserUserDto } from '@/types/api';

export const userService = {
  getMyUser() {
    return api.get<MyFundraiserUserDto>('/api/France/Mobile/Users/GetMyFundraiserUser');
  },

  getMyAvatar() {
    return api.get<Blob>('/api/France/Web/Users/GetMyAvatar');
  },

  updateMyAvatar(file: File) {
    return api.upload<string>('/api/France/Web/Users/UpdateMyAvatar', file);
  },
};
