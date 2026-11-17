import {loadStore,commitStore,ApiError,failure as apiFailure} from './v1';
export const readStore=loadStore;
export const saveStore=(store:Awaited<ReturnType<typeof loadStore>>)=>commitStore(store,store.data,'Profil diperbarui');
export const account=(_req:Request,_data:any)=>null;
export const failure=apiFailure;
