import React, { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import amplitude from "amplitude-js";
import { Tabs } from "antd";
import Search from "./Search";
import Buy from "./Buy";
import Sell from "./Sell";
import Create from "./Create";
import Transactions from "./Transactions";

const DEFAULT_SEARCH = "explore";
const DEFAULT_RELOAD = {
  search: true,
  buy: true,
  sell: true,
  transactions: true,
};
const STYLES = {
  search: {
    marginBottom: "40px",
  },
};
const PAGE = "Marketplace";

const Marketplace = () => {
  const [isTestnet, setIsTestnet] = useState(null);
  const [search, setSearch] = useState(DEFAULT_SEARCH);
  const [reload, setReload] = useState(DEFAULT_RELOAD);
  const { account, chainId } = useMoralis();

  useEffect(() => {
    if (chainId === "0x4" || chainId === "0x13881") {
      setIsTestnet(true);
    } else {
      setIsTestnet(false);
    }
  }, [chainId]);

  useEffect(() => {
    setReload(DEFAULT_RELOAD);
  }, [account, chainId]);

  useEffect(() => {
    amplitude.getInstance().logEvent("View " + PAGE + " Page", {
      Page: PAGE,
    });
  }, []);

  return (
    <>
      <div className="page">
        <div className="container">
          {isTestnet ? (
            <Tabs defaultActiveKey="1" centered>
              <Tabs.TabPane key="1" tab={<h3>Buy</h3>}>
                <div style={STYLES.search}>
                  <Search
                    search={search}
                    setSearch={setSearch}
                    reload={reload}
                    setReload={setReload}
                  />
                </div>
                <Buy
                  search={search}
                  setSearch={setSearch}
                  reload={reload}
                  setReload={setReload}
                />
              </Tabs.TabPane>
              <Tabs.TabPane key="2" tab={<h3>Sell</h3>}>
                <Sell reload={reload} setReload={setReload} />
              </Tabs.TabPane>
              <Tabs.TabPane key="3" tab={<h3>Create</h3>}>
                <Create reload={reload} setReload={setReload} />
              </Tabs.TabPane>
              <Tabs.TabPane key="4" tab={<h3>Transactions</h3>}>
                <Transactions reload={reload} setReload={setReload} />
              </Tabs.TabPane>
            </Tabs>
          ) : (
            <p>Please switch to a testnet</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Marketplace;
