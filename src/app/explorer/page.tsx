import type { Metadata } from "next";
import { DataStatus } from "@/components/DataStatus";
import { Heatmap } from "@/components/explorer/Heatmap";
import { NetworkGraph } from "@/components/explorer/NetworkGraph";

export const metadata: Metadata = { title: "Model explorer" };

export default function ExplorerPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Model explorer</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Inspect every parameter of the model, together with its source and whether it is assumed.
        </p>
      </header>
      <DataStatus detailed />
      <Heatmap />
      <NetworkGraph />
    </div>
  );
}
