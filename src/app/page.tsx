import { AppFlow } from "@/features/app/app-flow";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-16">
        <header className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
            Alu AI / Milestone 1
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Upload your source data to get started
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground">
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
