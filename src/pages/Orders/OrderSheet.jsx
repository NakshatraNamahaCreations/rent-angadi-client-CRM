import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { useParams, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { ImageApiURL, ApiURL } from "../../api";
import { Container, Spinner, Button } from "react-bootstrap";
import axios from "axios";
import { parseDate } from "../../utils/parseDates";

const OrderSheet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [productDays, setProductDays] = useState({});
  const [loading, setLoading] = useState(false)

  // ✅ Fetch order details directly from backend
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${ApiURL}/order/getOrder/${id}`);
        console.log(`res.data.order: `, res.data.order);
        const data = res.data.order;

        setOrder(data);
        if (data.slots) {
          const allItems = data.slots.flatMap((slot) => slot.products || []);
          setItems(allItems);

          // Calculate days for each product
          const daysObj = {};
          allItems.forEach((item) => {
            const start = parseDate(item.productQuoteDate);
            const end = parseDate(item.productEndDate);
            console.log(`item.name `, item.productName, `start: `, start, 'end: ', end);
            if (start && end) {
              const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
              daysObj[item.productId] = diff > 0 ? diff : 1;
            }
          });
          setProductDays(daysObj);
        }
      } catch (error) {
        console.error("Error fetching order data:", error);
      } finally {
        setLoading(false)
      }
    };

    fetchOrderDetails();
  }, [id]);

  // const parseDate = (str) => {
  //   if (!str) return null;
  //   const [day, month, year] = str.split("-");
  //   return new Date(`${year}-${month}-${day}`);
  // };

  const makeSafe = (val, fallback = "NA") => {
    if (!val && val !== 0) return fallback;
    return String(val)
      .trim()
      .replace(/[\/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 120) || fallback;
  };

  const buildFilename = (parts = [], ext = "pdf") => {
    const name = parts.map((p) => makeSafe(p)).join("-").replace(/_+/g, "_");
    return `${name}.${ext}`;
  };

  const formatDateToMonthName = (dateString) => {
    if (!dateString) return "";
    const [day, month] = dateString.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${day}_${months[month - 1]}`;
  };

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;

    const filename = buildFilename([
      formatDateToMonthName(order?.slots?.[0]?.quoteDate),
      formatDateToMonthName(order?.slots?.[0]?.endDate),
      order?.executivename,
      order?.Address,
      order?.clientName,
    ]);

    // Wait for all images to load before generating PDF
    const images = element.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = resolve;
              img.onerror = resolve;
            }
          })
      )
    );

    const options = {
      margin: [0.05, 0.05, 0.05, 0.05],
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().from(element).set(options).save();
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!order)
    return (
      <div className="container my-5">
        <h3>No Order Found</h3>
        <button className="btn btn-primary" onClick={() => navigate("/orders")}>
          Go Back
        </button>
      </div>
    );

  const startStr = order?.slots?.[0]?.quoteDate || order?.quoteDate;
  const endStr = order?.slots?.[0]?.endDate || order?.endDate;
  const startMoment = startStr ? moment(startStr, "DD-MM-YYYY", true) : null;
  const endMoment = endStr ? moment(endStr, "DD-MM-YYYY", true) : null;
  const numDays =
    startMoment && endMoment && startMoment.isValid() && endMoment.isValid()
      ? Math.max(1, endMoment.diff(startMoment, "days") + 1)
      : 1;

  return (
    <div className="container my-5">
      <Button
        onClick={handleDownloadPDF}
        variant="success"
        className="my-1 d-flex ms-auto"
      >
        Download Order Sheet
      </Button>

      <div
        ref={invoiceRef}
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 0,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2 style={{ fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
          Order Sheet
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          <tbody>
            <tr>
              <td style={tdLabel}>Company Name</td>
              <td style={tdValue}>{order.clientName}</td>
              <td style={tdLabel}>Client Name</td>
              <td style={tdValue}>{order.executivename}</td>
            </tr>
            <tr>
              <td style={tdLabel}>Slot</td>
              <td style={tdValue}>{order?.slots?.[0]?.slotName}</td>
              <td style={tdLabel}>Venue</td>
              <td style={tdValue}>{order.Address}</td>
            </tr>
            <tr>
              <td style={tdLabel}>Delivery Date</td>
              <td style={tdValue}>{order?.slots?.[0]?.quoteDate}</td>
              <td style={tdLabel}>Dismantle Date</td>
              <td style={tdValue}>{order?.slots?.[0]?.endDate}</td>
            </tr>
            <tr>
              <td style={tdLabel}>Incharge Name</td>
              <td style={tdValue}>{order.inchargeName || "N/A"}</td>
              <td style={tdLabel}>Incharge Phone</td>
              <td style={tdValue}>{order.inchargePhone || "N/A"}</td>
            </tr>
          </tbody>
        </table>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 24,
            fontSize: "13px",
          }}
        >
          <thead style={{ backgroundColor: "#2F75B5", color: "#fff" }}>
            <tr>
              <th style={th}>S.No</th>
              <th style={th}>Product Name</th>
              <th style={th}>Slot</th>
              <th style={th}>Image</th>
              <th style={th}>Units</th>
              <th style={th}>Days</th>
            </tr>
          </thead>
          <tbody>
            {items.map((product, idx) => (
              <tr key={idx}>
                <td style={td}>{idx + 1}</td>
                <td style={td}>{product.productName}</td>
                <td style={td}>{product.productSlot || order?.quoteTime}</td>
                <td style={td}>
                  {product.ProductIcon && (
                    <img
                      src={`${ImageApiURL}/product/${product.ProductIcon}`}
                      alt={product.productName}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </td>
                <td style={td}>{product.quantity}</td>
                <td style={td}>{productDays[product.productId] || 1}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ fontSize: "11px", marginTop: 30 }}>
          <strong>Note:</strong>
          <ol style={{ paddingLeft: 16 }}>
            <li>
              Additional elements would be charged on actuals, transportation
              would be additional.
            </li>
            <li>100% Payment for confirmation of event.</li>
            <li>
              Costing is merely for estimation purposes. Requirements are blocked
              post payment in full.
            </li>
            <li>
              If inventory is not reserved with payments, we are not committed to
              keep it.
            </li>
            <li>
              <strong>
                The nature of the rental industry that our furniture is frequently
                moved and transported, which can lead to scratches on glass,
                minor chipping of paintwork, & minor stains etc. We ask you to
                visit the warehouse to inspect blocked furniture if you wish.
              </strong>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// Common styles
const th = { border: "1px solid #666", padding: 8, textAlign: "center" };
const td = { border: "1px solid #666", padding: 8, textAlign: "center" };
const tdLabel = { border: "1px solid #ccc", padding: "6px", fontWeight: 600 };
const tdValue = { border: "1px solid #ccc", padding: "6px" };

export default OrderSheet;
