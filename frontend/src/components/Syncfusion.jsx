import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
    DocumentEditorContainerComponent, Toolbar
} from '@syncfusion/ej2-react-documenteditor';

DocumentEditorContainerComponent.Inject(Toolbar);
function Syncfusion() {
    return (
    <DocumentEditorContainerComponent id="container" height={'590px'} serviceUrl="https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/" enableToolbar={true} />);
}
export default Syncfusion;

