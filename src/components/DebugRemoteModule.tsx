// // packages/host/src/components/DebugRemoteModule.tsx (temporary debug file)
// import React from 'react';
// import RemoteModule from './RemoteModule';
// import { useAppContext } from '../context/AppContext';
// import { MicroFrontendConfig } from '../types/types';

// interface DebugRemoteModuleProps {
//   config: MicroFrontendConfig;
// }

// const DebugRemoteModule: React.FC<DebugRemoteModuleProps> = ({ config }) => {
//   const { state } = useAppContext();
  
//   console.log('🔍 DebugRemoteModule render:', {
//     module: config.module,
//     user: state.user,
//     userExists: !!state.user,
//     loading: state.loading,
//     currentPath: window.location.pathname
//   });

//   // Add this critical check
//   if (config.module === './UserProfile' && !state.user) {
//     console.error('❌ CRITICAL: UserProfile module loaded without user data!');
//   }

//   // Add debug overlay
//   return (
//     <div style={{ position: 'relative' }}>
//       {/* Debug info overlay - remove in production */}
//       <div style={{
//         position: 'fixed',
//         top: 0,
//         right: 0,
//         background: 'rgba(0,0,0,0.8)',
//         color: 'white',
//         padding: '10px',
//         fontSize: '12px',
//         zIndex: 9999,
//         maxWidth: '300px'
//       }}>
//         <strong>Debug Info:</strong><br/>
//         Module: {config.module}<br/>
//         User: {state.user ? state.user.username : 'null'}<br/>
//         Loading: {state.loading ? 'yes' : 'no'}<br/>
//         Props passed: {state.user ? 'user data included' : 'no user data'}
//       </div>
      
//       <RemoteModule 
//         config={config}
//         user={state.user}
//         key={`${config.module}-${state.user?.id}-${Date.now()}`}
//       />
//     </div>
//   );
// };

// export default DebugRemoteModule;