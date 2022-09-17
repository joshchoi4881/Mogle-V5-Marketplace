import React, { useState, useEffect } from "react";
import { useMoralis, useWeb3ExecuteFunction } from "react-moralis";
/* import { useNotification } from "web3uikit"; */
import { ethers } from "ethers";
import amplitude from "amplitude-js";
import { Form, Select, Input, Button } from "antd";
import { useMarketplace } from "../../../providers/MarketplaceProvider";
import Loader from "../../UI/Loader";

const { Option } = Select;

const CATEGORIES = ["Development", "Marketing", "Art", "Music", "Other"];
const MINT_NFT = "mintNFT";
const PAGE = "Marketplace";
const FEATURE = "Create";

const Create = ({ reload, setReload }) => {
  const [category, setCategory] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const { account, chainId } = useMoralis();
  const contractProcessor = useWeb3ExecuteFunction();
  const { contractAddress, contractAbi } = useMarketplace();
  /* const dispatch = useNotification(); */

  useEffect(() => {
    amplitude.getInstance().logEvent("View " + FEATURE + " Feature", {
      Page: PAGE,
      Feature: FEATURE,
    });
  }, []);

  const onFinish = async ({ category, deliverable }) => {
    setIsLoading("Loading");
    const options = {
      contractAddress: contractAddress[chainId],
      functionName: MINT_NFT,
      abi: contractAbi,
      params: {
        account: account,
        category,
        deliverable,
      },
    };
    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        setIsLoading("Minting");
        onMintSuccess();
      },
      onError: (error) => {
        console.error(error);
        setIsLoading(false);
      },
    });
  };

  const onFinishFailed = (error) => {
    console.error(error);
  };

  const onMintSuccess = () => {
    const onNewMint = (tokenId, sender) => {
      if (chainId === "0x1") {
        alert(
          `OpenSea: https://opensea.io/assets/${
            contractAddress[chainId]
          }/${tokenId.toNumber()}`
        );
        /* dispatch({
          type: "success",
          position: "topL",
          title: "Success",
          message: `OpenSea: https://opensea.io/assets/${
            contractAddress[chainId]
          }/${tokenId.toNumber()}`,
        }); */
      } else if (chainId === "0x89") {
        alert(
          `OpenSea: https://opensea.io/assets/matic${
            contractAddress[chainId]
          }/${tokenId.toNumber()}`
        );
        /* dispatch({
          type: "success",
          position: "topL",
          title: "Success",
          message: `OpenSea: https://opensea.io/assets/matic${
            contractAddress[chainId]
          }/${tokenId.toNumber()}`,
        }); */
      } else if (chainId === "0x4") {
        alert(
          `OpenSea: https://testnets.opensea.io/assets/${
            contractAddress[chainId]
          }/${tokenId.toNumber()}`
        );
        /* dispatch({
          type: "success",
          position: "topL",
          title: "Success",
          message: `OpenSea: https://testnets.opensea.io/assets/${
            contractAddress[chainId]
          }/${tokenId.toNumber()}`,
        }); */
      } else if (chainId === "0x13881") {
        alert(
          `OpenSea: https://testnets.opensea.io/assets/mumbai/${
            contractAddress[chainId]
          }/${tokenId.toNumber()}`
        );
        /*  dispatch({
          type: "success",
          position: "topL",
          title: "Success",
          message: `OpenSea: https://testnets.opensea.io/assets/mumbai/${
            contractAddress[chainId]
          }/${tokenId.toNumber()}`,
        }); */
      }
      setIsLoading(false);
      setReload({ ...reload, sell: true });
    };
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      contractAddress[chainId],
      contractAbi,
      signer
    );
    if (contract) {
      contract.on("NewMint", onNewMint);
    }
    return () => {
      if (contract) {
        contract.off("NewMint", onNewMint);
      }
    };
  };

  const onSelectChange = (value) => {
    setCategory(value);
  };

  return (
    <>
      {isLoading ? (
        <Loader header={isLoading} />
      ) : (
        <>
          <Form
            name="basic"
            labelCol={{
              span: 8,
            }}
            wrapperCol={{
              span: 16,
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label="Category"
              name="category"
              rules={[
                {
                  required: true,
                  message: "Please select a category",
                },
              ]}
            >
              <Select
                value={category}
                placeholder="Select Category"
                optionFilterProp="children"
                showSearch
                onChange={onSelectChange}
              >
                {CATEGORIES.map((category, i) => (
                  <Option key={i} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Deliverable"
              name="deliverable"
              rules={[
                {
                  required: true,
                  message: "Please enter a deliverable",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              wrapperCol={{
                offset: 8,
                span: 16,
              }}
            >
              <Button type="primary" htmlType="submit">
                Mint
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
    </>
  );
};

export default Create;
