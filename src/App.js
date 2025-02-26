import React, { useState, useEffect } from 'react';
import {
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Link, Image, Undo, Redo, Sparkles, X, Send, Bot, CheckCircle,
} from 'lucide-react';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const loadingGif = '/loading.gif';

Modal.setAppElement('#root');

const EmailEditor = () => {
  const [emailContent, setEmailContent] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessBar, setShowSuccessBar] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scores, setScores] = useState({
    subjectLine: 0,
    writingStyle: 0,
    content: 0,
    structure: 0,
    personalization: 0,
  });
  const [suggestions, setSuggestions] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [scoringLoadingMessage, setScoringLoadingMessage] = useState(""); // New state for scoring loading message


  const [emailParams, setEmailParams] = useState({
    sales_info: {
      name: 'Nguyễn Văn A',
      title: 'Nhân viên kinh doanh',
      contact_info: {
        phone: '0912345678',
        email: 'nguyenvana@fastwork.vn'
      }
    },
    customer_info: {
      name: 'Trần Thị B',
      title: 'Giám đốc Marketing',
      company: 'Công ty ABC',
      contact_info: {
        phone: '0987654321',
        email: 'tranthib@congtyabc.com'
      }
    },
    emailContext: '', // Will be populated in useEffect
    tone: 'professional',
    length: 'medium',
  });

  // Use useEffect to set the default emailContext
  useEffect(() => {
    setEmailParams(prevParams => ({
      ...prevParams,
      emailContext: "Giới thiệu sản phẩm phần mềm quản lý doanh nghiệp Fastwork, bao gồm các tính năng nổi bật như quản lý công việc, quản lý nhân sự, quản lý khách hàng, và quản lý tài chính. Nhấn mạnh vào lợi ích của phần mềm trong việc nâng cao hiệu quả hoạt động và tăng trưởng doanh thu cho doanh nghiệp."
    }));
  }, []);

  const toolbarButtons = [
    { icon: <Bold size={18} />, label: 'Bold' },
    { icon: <Italic size={18} />, label: 'Italic' },
    { icon: <AlignLeft size={18} />, label: 'Align Left' },
    { icon: <AlignCenter size={18} />, label: 'Align Center' },
    { icon: <AlignRight size={18} />, label: 'Align Right' },
    { icon: <Link size={18} />, label: 'Insert Link' },
    { icon: <Image size={18} />, label: 'Insert Image' },
    { icon: <Undo size={18} />, label: 'Undo' },
    { icon: <Redo size={18} />, label: 'Redo' },
  ];

  const bottomBarButtons = [
    { label: 'Chuyên nghiệp hơn', action: () => refineEmail('professional') },
    { label: 'Ngắn gọn hơn', action: () => refineEmail('shorter') },
    { label: 'Cá nhân hóa hơn', action: () => refineEmail('personalized') },
  ];

  const handleInputChange = (section, field, value, isNested = false, nestedField = null) => {
    setEmailParams(prev => {
      if (isNested) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [nestedField]: {
              ...prev[section][nestedField],
              [field]: value
            }
          }
        };
      } else {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
    });
  };

  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/api/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail}`);
      }

      const data = await response.json();
      setEmailContent(data.generatedEmail);
      setShowSuccessBar(true);
      toast.success("Email đã được tạo thành công!");

      // Reset scores and suggestions on new email generation:
      setScores({
        subjectLine: 0,
        writingStyle: 0,
        content: 0,
        structure: 0,
        personalization: 0,
      });
      setSuggestions("");


    } catch (error) {
      console.error('Lỗi khi tạo email:', error);
      toast.error(`Lỗi khi tạo email: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const refineEmail = async (refinementType) => {
    try {
      const requestBody = {
        emailContent: emailContent,
        refinementType: refinementType,
        suggestions: refinementType === 'improvement' ? suggestions : undefined,
      };
      const response = await fetch('http://localhost:8000/api/refine-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail}`);
      }
      const data = await response.json();
      setEmailContent(data.refinedEmail);
      toast.success("Email đã được tinh chỉnh thành công!");

    } catch (error) {
      console.error('Lỗi khi tinh chỉnh email:', error);
      toast.error(`Lỗi khi tinh chỉnh: ${error.message}`);
    }
  };

  const scoreEmail = async () => {
    setIsScoring(true); // Keep this for the main button
    setShowScoreModal(true);
    setScoringLoadingMessage("Đang chấm điểm email..."); // Initial loading message
    try {
      const response = await fetch('http://localhost:8000/api/score-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailContent: emailContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail}`);
      }

      const data = await response.json();

      if (data && data.scores && data.suggestions) {
        setScores(data.scores);
        setSuggestions(data.suggestions);
        setScoringLoadingMessage(""); // Clear loading message on success
      } else {
        console.error("Invalid response format:", data);
        toast.error("Đã nhận được định dạng phản hồi không mong muốn từ máy chủ. Vui lòng thử lại.");
        setShowScoreModal(false);
          setScoringLoadingMessage(""); // Clear loading message

      }

    } catch (error) {
      console.error('Lỗi khi chấm điểm email:', error);
      toast.error(`Lỗi khi chấm điểm email: ${error.message}`);
      setShowScoreModal(false);
        setScoringLoadingMessage(""); // Clear loading message
    } finally {
      setIsScoring(false); // Keep this for the main button
    }
  };

  const closeModal = () => {
    setShowScoreModal(false);
     setScoringLoadingMessage(""); // Clear loading message
  };

  const autoSuggest = async () => {
    setModalLoading(true);
    setScoringLoadingMessage("Đang cải thiện email..."); // Set loading message
    try {
      await refineEmail('improvement');
      toast.success("Email đã được cải thiện thành công!");
      closeModal();
    } catch (error) {
      console.error('Lỗi khi tự động gợi ý email:', error);
      // Error toast is handled by refineEmail
    } finally {
      setModalLoading(false);
      setScoringLoadingMessage(""); // Clear loading message

    }
  };


  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '800px',
      maxHeight: '80vh',
      overflowY: 'auto',
      padding: '1rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: 'none',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
    },
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="max-w-6xl mx-auto p-4 flex gap-4">
        <div className="flex-1 bg-white shadow-lg rounded-lg p-4 flex flex-col">
          <div className="border border-gray-300 rounded mb-4 flex-grow">
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border-b border-gray-300">
              {toolbarButtons.map((button, index) => (
                <button
                  key={index}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title={button.label}
                >
                  {button.icon}
                </button>
              ))}
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`p-2 rounded transition-colors ml-auto ${
                  showAIPanel ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-200'
                }`}
                title="AI Assistant"
              >
                <Sparkles size={18} />
              </button>
            </div>

            <textarea
              className="w-full p-4 min-h-[300px] resize-y border-none focus:outline-none"
              placeholder="Nội dung email sẽ xuất hiện ở đây..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
            />
          </div>

          <div className="border-t bg-gray-100 p-2 flex items-center gap-2">
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              <Bot size={16} />
              Soạn Email với AI
            </button>

            {showSuccessBar && (
              <>
                <div className="h-4 border-l border-gray-300 mx-2"></div>
                {bottomBarButtons.map((button, index) => (
                  <button
                    key={index}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors text-sm"
                    onClick={button.action}
                    disabled={isRefining}
                  >
                    {isRefining ? (
                      <img src={loadingGif} alt="Loading..." className="h-5 w-5 inline-block mr-2" />
                    ) : null}
                    {button.label}
                  </button>
                ))}

                <div className="flex-grow"></div>

                <button
                  className="px-3 py-1.5 flex items-center gap-1 text-gray-600 hover:bg-gray-200 rounded-full transition-colors text-sm"
                  onClick={scoreEmail}
                  disabled={isScoring || isGenerating}
                >
                  {isScoring ? (
                    <img src={loadingGif} alt="Loading..." className="h-5 w-5 inline-block mr-2" />
                  ) : null}
                  <CheckCircle size={16} className="text-green-500" />
                  AI tự cải thiện
                </button>
              </>
            )}
          </div>
        </div>

        <Modal
          isOpen={showScoreModal}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="AI Email Score"
        >
          {scoringLoadingMessage ? (
            <div className="flex items-center justify-center h-full">
              <img src={loadingGif} alt="Loading..." className="h-12 w-12 mr-2" />
              <p>{scoringLoadingMessage}</p>
            </div>
            ) : (
            <>
                <div className="flex w-full">
                <div className="w-1/3 pr-4">
                    <h2 className="text-lg font-semibold mb-4">Đánh giá Email của AI</h2>
                    <ul>
                    <li className="flex justify-between items-center py-2">
                        <span>Tiêu đề:</span>
                        <span className="font-bold">{scores.subjectLine}/10</span>
                    </li>
                    <li className="flex justify-between items-center py-2">
                        <span>Cách viết:</span>
                        <span className="font-bold">{scores.writingStyle}/10</span>
                    </li>
                    <li className="flex justify-between items-center py-2">
                        <span>Nội dung:</span>
                        <span className="font-bold">{scores.content}/10</span>
                    </li>
                    <li className="flex justify-between items-center py-2">
                        <span>Cấu trúc:</span>
                        <span className="font-bold">{scores.structure}/10</span>
                    </li>
                    <li className="flex justify-between items-center py-2">
                        <span>Cá nhân hóa:</span>
                        <span className="font-bold">{scores.personalization}/10</span>
                    </li>
                    </ul>
                </div>

                <div className="w-2/3 pl-4 border-l">
                    <h2 className="text-lg font-semibold mb-4">Đề xuất</h2>
                    <p className="whitespace-pre-wrap">{suggestions}</p>
                </div>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                <button
                    onClick={autoSuggest}
                    disabled={modalLoading} // Use modalLoading here
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
                >
                    {modalLoading ? (  // Use modalLoading for the button's loading state
                        <>
                            <img src={loadingGif} alt="Loading..." className="h-5 w-5 inline-block mr-2" />
                            Đang xử lí...
                        </>
                    ) : (
                        "Tự động cải thiện"
                    )}
                </button>
                <button onClick={closeModal} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                    Đóng
                </button>
                </div>
            </>
          )}
        </Modal>

        {showAIPanel && (
          <div className="w-96 bg-white shadow-lg rounded-lg p-4 h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" />
                Email Generator
              </h3>
              <button
                onClick={() => setShowAIPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-6">
              {/* Sales Information */}
              <div className="space-y-3">
                <h4 className="font-medium">Thông tin người bán</h4>
                <input
                  type="text"
                  placeholder="Tên"
                  className="w-full p-2 border rounded"
                  value={emailParams.sales_info.name}
                  onChange={(e) => handleInputChange('sales_info', 'name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Chức vụ"
                  className="w-full p-2 border rounded"
                  value={emailParams.sales_info.title}
                  onChange={(e) => handleInputChange('sales_info', 'title', e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  className="w-full p-2 border rounded"
                  value={emailParams.sales_info.contact_info.phone}
                  onChange={(e) => handleInputChange('sales_info', 'phone', e.target.value, true, 'contact_info')}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-2 border rounded"
                  value={emailParams.sales_info.contact_info.email}
                  onChange={(e) => handleInputChange('sales_info', 'email', e.target.value, true, 'contact_info')}
                />
              </div>

              {/* Customer Information */}
              <div className="space-y-3">
                <h4 className="font-medium">Thông tin khách hàng</h4>
                <input
                  type="text"
                  placeholder="Tên"
                  className="w-full p-2 border rounded"
                  value={emailParams.customer_info.name}
                  onChange={(e) => handleInputChange('customer_info', 'name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Chức vụ"
                  className="w-full p-2 border rounded"
                  value={emailParams.customer_info.title}
                  onChange={(e) => handleInputChange('customer_info', 'title', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Công ty"
                  className="w-full p-2 border rounded"
                  value={emailParams.customer_info.company}
                  onChange={(e) => handleInputChange('customer_info', 'company', e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  className="w-full p-2 border rounded"
                  value={emailParams.customer_info.contact_info.phone}
                  onChange={(e) => handleInputChange('customer_info', 'phone', e.target.value, true, 'contact_info')}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-2 border rounded"
                  value={emailParams.customer_info.contact_info.email}
                  onChange={(e) => handleInputChange('customer_info', 'email', e.target.value, true, 'contact_info')}
                />
              </div>

              {/* Email Parameters */}
              <div className="space-y-3">
                <h4 className="font-medium">Nội dung/Bối cảnh Email</h4>
                <textarea
                  placeholder="Nội dung email"
                  className="w-full p-2 border rounded h-24"
                  value={emailParams.emailContext}
                  onChange={(e) => setEmailParams(prev => ({ ...prev, emailContext: e.target.value }))}
                />
                <h4 className="font-medium">Giọng văn</h4>
                <select
                  className="w-full p-2 border rounded"
                  value={emailParams.tone}
                  onChange={(e) => setEmailParams(prev => ({ ...prev, tone: e.target.value }))}
                >
                  <option value="professional">Chuyên nghiệp</option>
                  <option value="friendly">Thân thiện</option>
                  <option value="formal">Trang trọng</option>
                  <option value="casual">Thường ngày</option>
                </select>
                <h4 className="font-medium">Độ dài</h4>
                <select
                  className="w-full p-2 border rounded"
                  value={emailParams.length}
                  onChange={(e) => setEmailParams(prev => ({ ...prev, length: e.target.value }))}
                >
                  <option value="short">Ngắn</option>
                  <option value="medium">Vừa</option>
                  <option value="long">Dài</option>
                </select>
              </div>

              <button
                onClick={generateEmail}
                disabled={isGenerating}
                className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <img src={loadingGif} alt="Loading..." className="h-5 w-5 inline-block mr-2" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Tạo Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EmailEditor;
