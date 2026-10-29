import type {Metadata} from 'next';
import localFont from 'next/font/local';
const inter=localFont({src:'../public/fonts/InterVariable.woff2',variable:'--font-inter',display:'swap',weight:'100 900'});
import './globals.css';
import 'leaflet/dist/leaflet.css';
import './dark-theme.css';
export const metadata:Metadata={title:'Ember Atlas · Myanmar burning activity',description:'Historical MODIS and VIIRS common-grid burning activity explorer for Myanmar, 2015–2025.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body className={inter.variable}>{children}</body></html>}
