
    export type RemoteKeys = 'authApp/Login' | 'authApp/UserProfile';
    type PackageType<T> = T extends 'authApp/UserProfile' ? typeof import('authApp/UserProfile') :T extends 'authApp/Login' ? typeof import('authApp/Login') :any;