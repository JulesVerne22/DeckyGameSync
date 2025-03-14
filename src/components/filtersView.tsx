import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { DialogButton, ReorderableEntry, ReorderableList } from "@decky/ui";
import { textInputPopup } from "./popups";
import { CSS_STEAM_HIGHLIGHT_COLOR } from "../helpers/commonDefs";
import PageView from "./pageView";
import FilterPickerButton from "./filePickerButton";
import Config from "../helpers/config";
import Toaster from "../helpers/toaster";
import Row from "./row";
import { copy, paste } from "../helpers/utils";

interface FiltersViewProps {
  title: string;
  description?: string;
  fullPage: boolean;
  getFiltersFunction: () => Promise<Array<string>>;
  setFiltersFunction: (filters: Array<string>) => Promise<void>;
}

export default function filtersView({ title, description, fullPage = false, getFiltersFunction, setFiltersFunction: setFiltersFunction, children }: PropsWithChildren<FiltersViewProps>) {
  const saveButtonRef = useRef<HTMLDivElement>(null);

  const [filterEntries, setFilterEntries] = useState<Array<ReorderableEntry<void>>>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(Config.get("advanced_mode"));

  const filterEntriesToArray = (): Array<string> => {
    return filterEntries
      .sort((a, b) => a.position - b.position)
      .map((e) => String(e.label));
  }

  const filterEntriesFromArray = (arr: Array<string>): void => {
    setFilterEntries(arr.map((value, index) => ({
      label: value,
      position: index,
    })));
  }

  useEffect(() => {
    const registrations: Array<Unregisterable> = [];
    registrations.push(Config.on("advanced_mode", setShowAdvancedOptions));
    return () => {
      registrations.forEach(e => e.unregister());
    }
  }, []);

  useEffect(() => {
    getFiltersFunction().then(filterEntriesFromArray);
  }, [getFiltersFunction]);

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
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        paddingBottom: "14px",
      }}>
        <ReorderableList
          onSave={setFilterEntries}
          entries={filterEntries}
        />
          <Row>
            <FilterPickerButton
              text="Add Include Filter"
              onConfirm={(path: string) => {
                setFilterEntries([...filterEntries, {
                  label: `+ ${path}`,
                  position: filterEntries.length,
                }]);
              }}
            />
            <FilterPickerButton
              text="Add Exclude Filter"
              onConfirm={(path: string) => {
                setFilterEntries([...filterEntries, {
                  label: `- ${path}`,
                  position: filterEntries.length,
                }]);
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
                    setFilterEntries([...filterEntries, {
                      label: `${value}`,
                      position: filterEntries.length,
                    }]);
                  }
                )}
              >
                Add Arbitrary Line
              </DialogButton>
              <DialogButton
                onClick={() => {
                  copy(filterEntriesToArray().join('\n'));
                  Toaster.toast("Filters copied to clipboard")
                }}
              >
                Copy Whole Filter
              </DialogButton>
              <DialogButton
                onClick={() => {
                  filterEntriesFromArray(paste().trim().split('\n'));
                  Toaster.toast("Filters pasted from clipboard");
                }}
              >
                Paste Whole Filter
              </DialogButton>
            </Row>
          )}
          <Row>
            <DialogButton
              onClick={() => setFiltersFunction(filterEntriesToArray())}
              ref={saveButtonRef}
              style={{ backgroundColor: CSS_STEAM_HIGHLIGHT_COLOR }}
              onGamepadFocus={() => saveButtonRef.current && (saveButtonRef.current.style.backgroundColor = "white")}
              onGamepadBlur={() => saveButtonRef.current && (saveButtonRef.current.style.backgroundColor = CSS_STEAM_HIGHLIGHT_COLOR)}
            >
              Save
            </DialogButton>
          </Row>
        </div>
    </PageView>
  )
}