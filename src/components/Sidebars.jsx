import { Link, useLocation } from "react-router-dom";
import {
  FaClipboardList,
  FaTags,
  FaBoxOpen,
  FaUserFriends,
  FaShoppingBag,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaFileContract,
  FaChartBar,
  FaTools,
  FaChartLine,
} from "react-icons/fa";
import {
  MdDashboard,
  MdInventory,
  MdOutlineSupportAgent,
} from "react-icons/md";
import logo from "../assets/RentangadiLogo5.png";
import { useEffect, useState } from "react";
import axios from "axios";
import { config } from "../services/config";
import { ApiURL } from "../api";
// import logo from "../assets/RentangadiLogo2.svg";

const Sidebars = () => {
  const [userAccess, setUserAccess] = useState({});
  const location = useLocation();
  const token = sessionStorage.getItem("token");
  // const userAccess = JSON.parse(sessionStorage.getItem("roles"))

  const menuItems = [
    { key: "dashboard", name: "Dashboard", path: "/dashboard", icon: MdDashboard },
    { key: "master", name: "Master", path: "/master", icon: FaClipboardList },
    { key: "banner", name: "Banner", path: "/banner", icon: FaTags },
    { key: "productManagement", name: "Product Management", path: "/product-management", icon: FaBoxOpen },
    { key: "clients", name: "Clients", path: "/client", icon: FaUserFriends },
    { key: "executiveManagement", name: "Executive Management", path: "/executive-management", icon: MdInventory },
    { key: "addNewEnquiry", name: "Add new enq", path: "/add-new-enquiry", icon: MdInventory },
    { key: "myOrders", name: "Add new enq", path: "/my-orders", icon: MdInventory },
    { key: "enquiryList", name: "Enquiry List", path: "/enquiry-list", icon: MdOutlineSupportAgent },
    { key: "enquiryCalendar", name: "Enquiry Calendar", path: "/enquiry-calender", icon: FaCalendarAlt },
    { key: "quotation", name: "Quotation", path: "/quotation", icon: FaFileInvoiceDollar },
    { key: "orders", name: "Orders", path: "/orders", icon: FaShoppingBag },
    { key: "termsAndConditions", name: "Terms & Conditions", path: "/terms-conditions", icon: FaFileContract },
    { key: "paymentReport", name: "Payment Report", path: "/payment-report", icon: FaChartBar },
    { key: "refurbishmentReport", name: "Refurbishment Report", path: "/refurbihsment-report", icon: FaTools },
    { key: "inventoryProductList", name: "Inventory Product List", path: "/inventory-product-list", icon: MdInventory },
    { key: "adminRights", name: "Admin Rights", path: "/admin-rights", icon: MdInventory },
    // {
    //   name: "Product Reports",
    //   path: "/product-reports",
    //   icon: FaChartLine,
    // },
    // {
    //   name: "Client Reports",
    //   path: "/client-reports",
    //   icon: FaChartLine,
    // },
    { key: "reports", name: "Reports", path: "/reports", icon: FaChartLine },
    { key: "damagedAndLost", name: "Damaged/Lost", path: "/damaged-products", icon: FaChartBar }
  ];

  useEffect(() => {
    const fetchAdminPermissions = async () => {
      console.log(`fetching permissions in sidebar`);
      try {
        const res = await axios.get(`${ApiURL}/admins/permissions`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
        })
        console.log(`admin access: `, res.data);
        setUserAccess(res.data.admin.roles)
      } catch (error) {
        console.error(error)
      }
    }
    fetchAdminPermissions()
  }, [])

  // Filter menu items based on admin access
  const filtered = menuItems.filter((item) =>
    item.path !== "/login" &&
    (userAccess[item.key] || userAccess.length === 0)
  );

  console.log(`filtered menu items: `, filtered);

  const isActiveLink = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div
      className="flex-column flex-shrink-0 p-3 vh-100 position-fixed sidebar-scroll"
      style={{
        width: "20%",
        zIndex: 1,
        // background: "#323D4F",
        background: '#BD5525',
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div className="w-100 d-flex justify-content-center" style={{ backgroundColor: "black" }}>
        <Link to="/dashboard">
          <img
            src={logo}
            alt="logo"
            style={{ width: "200px" }}
            className="mx-auto"
          />
        </Link>
      </div>

      <ul className="nav flex-column mt-2">
        {console.log(`useracess: `, userAccess)}
        {(userAccess?.superAdmin === true ? menuItems : filtered).map((item, index) => (
          <li key={index} className="nav-item my-1">
            <Link
              to={item.path}
              className={`${isActiveLink(item.path) ? "custom-bg" : ""
                } nav-link d-flex align-items-center text-white`}
            >
              <item.icon className="me-2" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebars;
