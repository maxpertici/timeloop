import { useState } from "react";
import { Layout } from "@/components/Layout";
import { TrackView } from "@/views/TrackView";
import { CountView } from "@/views/CountView";
import { CategoriesView } from "@/views/CategoriesView";

type View = "track" | "count" | "categories";

function App() {
  const [currentView, setCurrentView] = useState<View>("track");

  const renderView = () => {
    switch (currentView) {
      case "track":
        return <TrackView />;
      case "count":
        return <CountView />;
      case "categories":
        return <CategoriesView />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;
