import { PropsWithChildren, useEffect, useState } from "react";
import { ButtonItem, Field, ReorderableList } from "@decky/ui";
import { textInputPopup } from "./popups";
import PageView from "./pageView";
import FilterPickerButton from "./filePickerButton";
import Config from "../helpers/config";
import Toaster from "../helpers/toaster";

interface FiltersViewProps {
  title: string;
  description?: string;
  fullPage: boolean;
  getFiltersFunction: () => Promise<Array<string>>;
  setFiltersFunction: (filters: Array<string>) => Promise<void>;
}

export default function filtersView({ title, description, fullPage = false, getFiltersFunction, setFiltersFunction, children }: PropsWithChildren<FiltersViewProps>) {
  const [filters, setFilters] = useState<Array<string>>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(Config.get("advanced_mode"));

  useEffect(() => {
    getFiltersFunction().then(setFilters);

    const registrations: Array<Unregisterable> = [];

    registrations.push(Config.on("advanced_mode", setShowAdvancedOptions));

    return () => {
      registrations.forEach(e => e.unregister());
    }

  }, []);

  return (
    <PageView
      title={title}
      description={description}
      fullPage={fullPage}
      titleItem={children}
    >
      <ReorderableList
        entries={filters.map((value, index) => ({
          label: value,
          position: index,
        }))}
        onSave={entries => {
          setFilters(entries
            .sort((a, b) => a.position - b.position)
            .map(entry => String(entry.label)));
        }}
      />
      <Field childrenContainerWidth="max">
        <FilterPickerButton
          text="Add Include Filter"
          onConfirm={(path: string) => {
            setFilters([...filters, `+ ${path}`]);
          }}
        />

        <FilterPickerButton
          text="Add Exclude Filter"
          onConfirm={(path: string) => {
            setFilters([...filters, `- ${path}`]);
          }}
        />
      </Field>
      {showAdvancedOptions && (
        <Field childrenContainerWidth="max">
          <ButtonItem
            onClick={() => textInputPopup(
              "Add Arbitrary String",
              "",
              (value: string) => {
                setFilters([...filters, value]);
              }
            )}
          >
            Add Arbitrary String
          </ButtonItem>
          <ButtonItem
            onClick={() =>
              navigator.clipboard.writeText(filters.join('\n'))
                .finally(() => Toaster.toast("Filters copied to clipboard"))
            }
          >
            Copy Whole Filter
          </ButtonItem>
          <ButtonItem
            onClick={() =>
              navigator.clipboard.readText()
                .then((text) => setFilters(text.trim().split('\n')))
                .finally(() => Toaster.toast("Filters pasted from clipboard"))
            }
          >
            Paste Whole Filter
          </ButtonItem>
        </Field>
      )}
      <ButtonItem
        onClick={() => setFiltersFunction(filters)}
      >
        Save
      </ButtonItem>
    </PageView>
  )
}