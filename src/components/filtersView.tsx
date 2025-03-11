import { PropsWithChildren, useEffect, useState } from "react";
import { DialogButton, ReorderableList } from "@decky/ui";
import { textInputPopup } from "./popups";
import PageView from "./pageView";
import FilterPickerButton from "./filePickerButton";
import Config from "../helpers/config";
import Toaster from "../helpers/toaster";
import Row from "./row";

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
      <div style={{
        overflowY: "scroll",
        overflowX: "hidden",
        marginLeft: "-20px",
      }}>
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
        <Row>
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
        </Row>
        {showAdvancedOptions && (
          <Row>
            <DialogButton
              onClick={() => textInputPopup(
                "Add Arbitrary String",
                "",
                (value: string) => {
                  setFilters([...filters, value]);
                }
              )}
            >
              Add Arbitrary String
            </DialogButton>
            <DialogButton
              onClick={() =>
                navigator.clipboard.writeText(filters.join('\n'))
                  .finally(() => Toaster.toast("Filters copied to clipboard"))
              }
            >
              Copy Whole Filter
            </DialogButton>
            <DialogButton
              onClick={() =>
                navigator.clipboard.readText()
                  .then((text) => setFilters(text.trim().split('\n')))
                  .finally(() => Toaster.toast("Filters pasted from clipboard"))
              }
            >
              Paste Whole Filter
            </DialogButton>
          </Row>
        )}
        <Row>
          <DialogButton
            onClick={() => setFiltersFunction(filters)}
          >
            Save
          </DialogButton>
        </Row>
      </div>
    </PageView>
  )
}