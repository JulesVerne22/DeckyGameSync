import { PropsWithChildren } from "react";
import { SHARED_FILTER_APP_ID } from "../helpers/commonDefs";
import FiltersView from "./filtersView";
import SyncFilters from "../helpers/syncFilters";

interface SharedFiltersViewProps {
  title: string;
  description?: string;
  fullPage: boolean;
}

export default function sharedFiltersView({ title, description, fullPage = false, children }: PropsWithChildren<SharedFiltersViewProps>) {
  return (<FiltersView
    title={title}
    description={description}
    fullPage={fullPage}
    getFiltersFunction={() => SyncFilters.get(SHARED_FILTER_APP_ID)}
    setFiltersFunction={(filters: Array<string>) => SyncFilters.set(SHARED_FILTER_APP_ID, filters)}
  >
    {children}
  </FiltersView>);
}