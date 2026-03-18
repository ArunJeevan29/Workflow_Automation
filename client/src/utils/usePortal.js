// client/src/utils/usePortal.js
import { useEffect, useState } from'react';

// Reusable hook to create a portal on the fly for overlay elements
function usePortal(id) {
 const [portalElement, setPortalElement] = useState(null);

 useEffect(() => {
 let element = document.getElementById(id);
 let created = false;

 if (!element) {
 created = true;
 element = document.createElement('div');
 element.id = id;
 document.body.appendChild(element);
 }
 setPortalElement(element);

 // Cleanup: remove the created div on unmount
 return () => {
 if (created && element.parentNode) {
 element.parentNode.removeChild(element);
 }
 };
 }, [id]);

 return portalElement;
}

export default usePortal;