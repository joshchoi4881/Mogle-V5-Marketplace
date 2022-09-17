import React, { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { Select } from "antd";
import { getEllipsisTxt } from "../../../helpers/formatters";

const { Option } = Select;

const ITEM_IMAGES = {
  "0x1": "EthereumItemImages",
  "0x4": "RinkebyItemImages",
  "0x13881": "MumbaiItemImages",
};

function Search({ search, setSearch, reload, setReload }) {
  const [collections, setCollections] = useState([]);
  const { chainId, Moralis } = useMoralis();
  const getCollections = async () => {
    const collections = [];
    const sellers = {};
    const itemImages = Moralis.Object.extend(ITEM_IMAGES[chainId]);
    const queryItemImages = new Moralis.Query(itemImages);
    const data = await queryItemImages.find();
    const processItemImages = JSON.parse(
      JSON.stringify(data, [
        "seller",
        "nftContractAddress",
        "tokenId",
        "name",
        "image",
      ])
    );
    for (const item of processItemImages) {
      const seller = item.seller;
      if (!sellers[seller]) {
        sellers[seller] = true;
        const collection = {
          seller: item.seller,
          address: item.nftContractAddress,
          name: item.name,
          image: item.image,
        };
        collections.push(collection);
      }
    }
    setCollections(collections);
  };

  useEffect(() => {
    if (reload.search) {
      getCollections();
      setReload({ ...reload, search: false });
    }
  }, [reload, setReload, getCollections]);

  const onSelectChange = (value) => {
    setSearch(value);
    setReload({ ...reload, buy: true });
  };

  return (
    <>
      <Select
        value={search}
        placeholder="Search Collections"
        optionFilterProp="children"
        showSearch
        style={{ width: "1000px", marginLeft: "20px" }}
        onChange={onSelectChange}
      >
        <Option key="explore" value="explore">
          Explore
        </Option>
        {collections &&
          collections.map((collection, i) => (
            <Option key={i} value={collection.seller}>
              {getEllipsisTxt(collection.seller)}
            </Option>
          ))}
      </Select>
    </>
  );
}

export default Search;
