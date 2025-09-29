import { useState } from "react";
import type { ColDef } from "ag-grid-enterprise";
import { ModuleRegistry, AllEnterpriseModule } from "ag-grid-enterprise";
ModuleRegistry.registerModules([AllEnterpriseModule]);
import { AgGridReact } from "ag-grid-react";

interface IRow {
  name: string;
  value: number;
}

export default function MainGrid() {
  const [rowData, setRowData] = useState<IRow[]>([
    { name: "KOSPI2", value: 1313 },
    { name: "SPX", value: 123 },
  ]);
  const [colDefs, setColDefs] = useState<ColDef<IRow>[]>([{ field: "name" }, { field: "value" }]);
  {
    return (
      <main className="min-h-0 min-w-0 overflow-hidden h-screen">
        <div className="m-5 h-full min-h-0 min-w-0">
          <div className="my-5 h-auto">
            <AgGridReact rowData={rowData} columnDefs={colDefs} domLayout="autoHeight"></AgGridReact>
          </div>
          <div className="my-5 h-auto">
            <AgGridReact rowData={rowData} columnDefs={colDefs} domLayout="autoHeight"></AgGridReact>
          </div>
        </div>
      </main>
    );
  }
}
