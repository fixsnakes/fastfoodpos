import { useState,useEffect  } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { IoIosSearch } from "react-icons/io";
import { jsPDF } from "jspdf";

import { IoIosMan } from "react-icons/io";
import { FaRegTrashAlt } from "react-icons/fa";
import { CiUser } from "react-icons/ci";

import { IoMdAdd } from "react-icons/io";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedProduct, setSelectedProduct] = useState([])
  const [employee,setEmployee] = useState(null)
  const [customer,setCustomer] = useState(null)
  const [inputemployee,setInputEmployee] = useState('')
  const [inputcustomer,setInputCustomer] = useState('')
  const [modelopen,setModelopen] = useState(false)
  const [inputvoucher,setInputVoucher] = useState(null)
  const [voucher,setVoucher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderpopup, setOrderpopup] = useState(false);
  const [orderData,setorderData] = useState([]);


  //tim mon an
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([])
      return
    }

    // 300ms
    const timerId = setTimeout(() => {
      fetch(`http://localhost:8080/api/products?name=${encodeURIComponent(searchTerm)}`)
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(err => {
          console.error(err)
          setSuggestions([])
        })
    }, 300)

    return () => clearTimeout(timerId)
  }, [searchTerm])


  //add mon an da chon
  const handleSelect = (product) => {
    const existedproduct = selectedProduct.find(p => product.product_id === p.id);
    if(!existedproduct){
      setSelectedProduct([...selectedProduct,{...product,quantity:1}])
    }
    setSuggestions([])
    setSearchTerm("")
  }

  //xoa mon an da chon
  const HandleDeteleProduct = (id_item) => {
      setSelectedProduct(selectedProduct.filter((product) => id_item !== product.product_id))
  }


  //kiemtra quantity
  const handleQuantityChange =(product_id,value) => {
    setSelectedProduct(selectedProduct.map((product) => {
      if(product_id == product.product_id){
        const newQuantity = Math.max(1, parseInt(value));
        return {...product,quantity:newQuantity};
      }

      return product
    }))
  }

  //gettongtienhang

  const gettongtienHang = () => {
      let total = 0;
      selectedProduct.map((product) => total += product.price*product.quantity)
      return total
  }


  //findnhanvien
  const handlefindemployee = async (employeeid) => {
      const response = await fetch("http://localhost:8080/api/employee/find",{
        method : "POST",
        headers : {
          "Content-Type" : "application/json"
        },
        
        body: JSON.stringify({employee_id : employeeid})
      })
      
      if (response.ok){
        const data = await response.json()
        setEmployee(data)
        toast.success("Success");
      }
      else{
        toast.error("Không tìm thấy nhân viên");
      }

      setInputEmployee("")
      
  }

  //findcustomer

  const handlefindcustomer = async (customerphone) => {
    const response = await fetch("http://localhost:8080/api/customers/find",{
      method : "POST",
      headers : {
        "Content-Type" : "application/json"
      },
      
      body: JSON.stringify({phone : customerphone})
    })
    
    if (response.ok){
      const data = await response.json()
      setCustomer(data)
      toast.success("Success");
    }
    else{
      toast.error("Không tìm thấy khách hàng");
    }

    setInputCustomer("")
    
  }

  //handlevoucher

  const handleApplyVoucher = async (voucher) => {
    const response = await fetch(`http://localhost:8080/api/vouchers/${voucher}`);
    if (response.ok) {
        const data = await response.json();
        
        setVoucher(data)
        toast.success("Áp dụng thành công mã giảm giá " + data.code)
        
      } else {
        return;
      }
  };


  // getgiamgia
  const getGiamgia = () => {
    if(voucher){
      return voucher.discount;
    }

    return 0;
  }

  //handle thanh toan
  const HandleThanhToan = async () => {
    setLoading(true); // Bắt đầu loading
    const orderDetails = selectedProduct.map((product) => ({
          product,
          price: product.price,
          quantity: product.quantity,
      }));  

    const orderDataReq = {
        customer,
        employee,
        order_type: "Tại Quầy",
        total_amount: gettongtienHang() - (gettongtienHang()* (getGiamgia()/100)),
        voucher: voucher, 
        payment_method: "Tiền Mặt",
        orderDetails: orderDetails,
    };

    try {
        const response = await fetch("http://localhost:8080/api/createorder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderDataReq),
        });

        if (response.ok) {
            const data = await response.json();
            toast.success("Order thành công đơn hàng " + data.order_id);
            setorderData(data)
            setOrderpopup(true)
        } else {
            toast.error("Lỗi");
        }
    } catch (error) {
        toast.error("Lỗi kết nối: " + error.message);
    } finally {
        setLoading(false); 
    }
  };


  const togglePopup = () => setOrderpopup(!orderpopup);
  




  return (
    <>
      <div className='w-full h-15 bg-blue-600 flex p-3 gap-3 relative justify-between'>
         
          {/* Search Input */}
          <div className='border-white-2 rounded-md w-100 bg-white flex items-center p-2'>

              <IoIosSearch className="h-7 w-8 text-gray-700"></IoIosSearch>
              <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm món ăn"
                  className="flex-grow outline-none text-gray-700 ml-2"
                />

                
          </div>
          
          {suggestions.length > 0 ? (
              <ul className="absolute mt-10 z-10 bg-white w-100 max-h-64 overflow-y-auto border border-gray-200 rounded-md shadow-lg">
                {suggestions.map((item) => (
                  <li
                    key={item.product_id}
                    onClick={() => handleSelect(item)}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex flex-col gap-1"
                  > 
                    <img src={item.img_url} className='rouded-md w-10 h-10' alt="" />
                    <p className='text-md font-semibold'>{item.name}</p>
                    <p className='text-xs'>ID SP: {item.product_id}</p>
                  </li>
                ))}
              </ul>
            ) : searchTerm && suggestions.length === 0 ? (
              <div className="absolute mt-10 z-10 bg-white w-100 max-h-48 overflow-y-auto border border-gray-200 rounded-md shadow-lg">
                <p className="p-2 text-gray-500">Không tìm thấy sản phẩm nào</p>
              </div>
            ) : null}


            <div>
              <p className='text-white text-center font-semibold mt-1'>POS FAST FOOD</p>
            </div>
      </div>
      

      {/* Main container*/}
      <div className='flex h-screen w-full bg-gray-100 p-2'>
        
        {/* Display Product Selected */}
        <div className='w-2/3 flex flex-col gap-5 p-5'>

           {selectedProduct.length === 0 ? (
            
              <>
                <p className='text-gray-500'>Chưa có món ăn nào được chọn.</p>

              </>
            )
            : (
              <>
              <div>
              <p className='text-gray-500 text-lg font-bold mb-5'>Danh sách món ăn</p>
                {selectedProduct.map((product) => (
                  <>
                      <div key={product.product_id} className='flex items-center justify-between bg-white rounded-lg p-3 mb-4 shadow-md'>

                        <div className='flex gap-5 items-center w-50'>
                          <img className='w-10 h-10' src={product.img_url} alt="" />
                          <p className='font-semibold text-sm'>{product.name}</p>
                        </div>

                        <div className='flex gap-5 items-center'>
                          <p className='font-semibold text-sm'>Số Lượng: </p>
                          <input type="number"
                            value={product.quantity}
                            onChange={(e) => handleQuantityChange(product.product_id, parseInt(e.target.value))}
                            className='outline-none border-gray-300 border-b-2 w-10 focus:border-blue-400 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                          />
                        </div>

                        <div className='flex gap-10'>
                            <p className='font-semibold text-sm' >Đơn Giá: {(product.price).toLocaleString("VN")} VND</p>
                            <p className='font-semibold text-sm'>Tổng Tiền: {(product.price*product.quantity).toLocaleString("VN")} VND</p>
                        </div>

                        <div>
                            <FaRegTrashAlt onClick={() => HandleDeteleProduct(product.product_id)} className='w-5 h-5 hover:cursor-pointer hover:transition-transform delay-300 ease-in-out'></FaRegTrashAlt>
                        </div>
                      </div>
                  </>
                ))}
              </div>
              </>
            )
           
           
           }
        </div>

        {/* Display Total And Payment */}

        <div className='w-fit p-4 h-fit gap-10 flex flex-col justify-between bg-white rounded-lg shadow-lg mt-18 '>
            <h1 className='text-center font-bold text-2xl'>Thanh Toán</h1>
            <div className='flex flex-col gap-5'>

              {/* Nhan Vien */}
              <div className='flex items-center gap-5'>
                <IoIosMan className='h-5 w-5 text-gray-400'></IoIosMan>
                <p className='text-sm font-semibold w-20'>Nhân viên:</p>
                <p className='text-xs w-30 text-center font-semibold bg-gray-300 p-2 rounded-md'>{employee ? employee.fullname : "Trống"}</p>


                
                <input type="text"
                placeholder='Tìm nhân viên...'
                value={inputemployee}
                onChange={(e) => setInputEmployee(e.target.value)}
                className='p-2 rounded-md border-gray-300 border-1 text-sm' />

                <button onClick={() => handlefindemployee(parseInt(inputemployee))} className='bg-gray-300 text-black p-2 rounded-md hover:cursor-pointer'><IoIosSearch className='w-5 h-5'></IoIosSearch></button>
              </div>

              {/* Khach Hang */}
              <div className='flex items-center gap-5'>
                <CiUser className='h-5 w-5 text-gray-400'></CiUser>
                <p className='text-sm font-semibold w-20'>Khách hàng:</p>
                <p className='text-xs w-30 text-center font-semibold bg-gray-300 p-2 rounded-md'>{customer ? customer.fullname : "Trống"}</p>
                <input type="text"
                placeholder='Tìm Khách Hàng...'
                value={inputcustomer}
                onChange={(e) => setInputCustomer(e.target.value)}
                className='p-2 rounded-md border-gray-300 border-1 text-sm' />
                <button onClick={() => handlefindcustomer(inputcustomer)} className='bg-gray-300 text-black p-2 rounded-md hover:cursor-pointer'><IoIosSearch className='w-5 h-5'></IoIosSearch></button>
                <button className='bg-gray-300 p-2 rounded-md hover:cursor-pointer text-black font-bold' onClick={() => setModelopen(!modelopen)}><IoMdAdd className='w-5 h-5'></IoMdAdd></button>
              </div>


              {/* Display So Mon */}
              <div className='flex justify-between items-center'>

                <p className='font-semibold'>Tổng Số Món:</p>
                <p className='font-semibold text-xl'>{selectedProduct.length}</p>
              </div>

              {/* Display tổng tiền hàng*/}

              <div className='flex justify-between items-center'>
                <p className='font-semibold'>Tổng Tiền:</p>
                <p className='font-semibold text-xl'>{gettongtienHang().toLocaleString("VN")}</p>
              </div>


              <div className='flex justify-between items-center'>
                <p className='font-semibold'>Voucher:</p>

                <input type="text"
                value={inputvoucher}
                onChange={(e) => setInputVoucher(e.target.value)}
                className='outline-none border-gray-300 border-b-2 w-50 focus:border-blue-400 text-center'
                placeholder='Nhập mã giảm giá...' />
                
                <button onClick={() => handleApplyVoucher(inputvoucher)} className='bg-blue-500 p-2 rounded-md text-white text-sm hover:cursor-pointer font-semibold'>Áp dụng</button>
              </div>

              <div className='flex justify-between items-center'>
                <p className='font-semibold'>Giảm giá</p>
                <p className='font-semibold text-xl'>{getGiamgia()} %</p>
              </div>

              <div className='flex justify-between items-center'>
                <p className='font-semibold'>Khách cần trả</p>
                <p className='font-semibold text-blue-500 text-2xl'>{(gettongtienHang() - (gettongtienHang()* (getGiamgia()/100))).toLocaleString("VN")} VND</p>
              </div>

              <div className='flex justify-between items-center'>
                <p className='font-semibold'>Phương thức thanh toán</p>
                <div className='flex gap-1 items-center'>
                
                  <p className='text-md font-semibold p-2 bg-gray-200 rounded-md'>Tiền mặt</p>
                </div>
                
              </div>

            </div>


            

            <button
              onClick={() => HandleThanhToan()}
              className='bg-blue-500 rounded-md p-3 text-white font-semibold hover:cursor-pointer'
              disabled={loading} // Disable nút khi đang tải
          >
              {loading ? (
                  <div className="spinner-border animate-spin w-6 h-6 border-4 border-t-4 border-white rounded-full"></div> // Spinner
              ) : (
                  'Thanh Toán'
              )}
          </button>
            
        </div>
      </div>

      {modelopen && (
        <>
          <div className='fixed inset-0 bg-gray-50/60  z-99 flex justify-center items-center'>
            <div className="w-100 h-fit bg-white rounded-md border-1 flex flex-col p-10 gap-1">
                              <p className="text-2xl mb-3">Thêm Khách Hàng</p>
                              <label htmlFor="fullname">Tên</label>
                              <input id="fullname" type="text" placeholder="" className="w-full p-2 border-black border-2 rounded-md" />
                              <label htmlFor="phone">Số điện thoại</label>
                              <input id="phone" type="text" placeholder="" className="w-full p-2 border-black border-2 rounded-md " /> 
                              <div className="ouline-none flex justify-end gap-3 mt-3">
                                  <button className="p-2 text-white bg-red-500 rounded-md hover:cursor-pointer">Hủy</button>
                                  <button className="p-2 text-white bg-blue-500 rounded-md hover:cursor-pointer">Lưu</button>
                            </div>
              </div>
          </div>
        </>
      )}


      {orderpopup && (
        <div className="fixed inset-0 bg-gray-50/80 z-99 flex justify-center items-center">
          <div className="bg-white p-6 rounded-4xl max-w-lg w-full shadow-lg">
          
            <h2 className="text-2xl font-bold mb-4 text-center">Đơn Hàng #{orderData.order_id}</h2>
            <p><strong>Ngày đặt hàng: </strong>{new Date(orderData.order_date).toLocaleDateString()}</p>
            <p><strong>Phương Thức Thanh Toán: </strong>{orderData.payment_method}</p>
            <p><strong>Trạng Thái: </strong>{orderData.order_status}</p>
            <p><strong>Nhân viên: </strong>{orderData.employee.fullname}</p>
           
      

            <p><strong>Khách Hàng: </strong>{orderData.customer.fullname}</p>
            <p><strong>SĐT: </strong>{orderData.customer.phone}</p>

            <h3 className="mt-4 font-semibold text-lg">Chi Tiết Đơn Hàng</h3>
            <div>
              {orderData.orderDetails.map((item, index) => (
                <div key={index} className="flex justify-between items-center mb-2">
                  <img
                    src={item.product.img_url}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-md mr-4"
                  />
                  <div className="flex-1">
                    <p>{item.product.name}</p>
                    <p>Số Lượng: {item.quantity}</p>
                  </div>
                  <p>{item.price.toLocaleString()} VND</p>
                </div>
              ))}
            </div>

            <p><strong>Tổng Tiền: </strong>{orderData.total_amount.toLocaleString()} VND</p>
            
            
            <div className='flex justify-end'>
              <button
                onClick={() => setOrderpopup(!orderpopup)}
                className="bg-blue-500 text-white font-bold p-2 rounded-md text-center"
              >
                OK
              </button>
            </div>
            
            
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  )
}

export default App
