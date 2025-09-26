import { AppFlow } from "@/features/app/app-flow";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
            Alu AI / Milestone 1
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Upload your source data to get started
          </h1>
          <p className="mt-4 text-balance text-base text-muted-foreground text-center">
            Drag and drop an Excel or CSV file, or click below to browse from your
            computer. We&apos;ll parse the data and guide you through mapping and
            refinement in the next steps.
          </p>
        </header>
        <AppFlow />
      </div>
    </div>
  );
}
