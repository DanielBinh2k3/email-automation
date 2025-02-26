import React, { useState, useEffect } from 'react'; // Import useEffect
import {
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Link, Image, Undo, Redo, Sparkles, X, Send, Bot, CheckCircle,
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Modal from 'react-modal';
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
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

  const callGeminiAPI = async (prompt) => {
    const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  };

  const callGeminiWithStructuredOutput = async (prompt, outputSchema) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const parser = StructuredOutputParser.fromZodSchema(outputSchema);
      const formatInstructions = parser.getFormatInstructions();

      const promptTemplate = new PromptTemplate({
        template: `{prompt}\n\n{format_instructions}`,
        inputVariables: ["prompt"],
        partialVariables: { format_instructions: formatInstructions },
      });

      const formattedPrompt = await promptTemplate.format({ prompt });
      const result = await model.generateContent(formattedPrompt);
      const response = await result.response;
      const text = response.text();
      return await parser.parse(text);

    } catch (error) {
      console.error("Lỗi trong quá trình gọi API có cấu trúc:", error);
      throw error;
    }
  };


  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      const prompt = `
        Tạo một email dựa trên các thông tin sau:

        Thông tin người bán:
        - Tên: ${emailParams.sales_info.name}
        - Chức vụ: ${emailParams.sales_info.title}
        - Số điện thoại: ${emailParams.sales_info.contact_info.phone}
        - Email: ${emailParams.sales_info.contact_info.email}

        Thông tin khách hàng:
        - Tên: ${emailParams.customer_info.name}
        - Chức vụ: ${emailParams.customer_info.title}
        - Công ty: ${emailParams.customer_info.company}
        - Số điện thoại: ${emailParams.customer_info.contact_info.phone}
        - Email: ${emailParams.customer_info.contact_info.email}

        Nội dung email:
        ${emailParams.emailContext}

        Giọng văn mong muốn: ${emailParams.tone}
        Độ dài mong muốn: ${emailParams.length}

        Vui lòng tạo một email hoàn chỉnh, được định dạng tốt.
      `;
      const generatedEmail = await callGeminiAPI(prompt);
      setEmailContent(generatedEmail);
      setShowSuccessBar(true);
    } catch (error) {
      console.error('Lỗi khi tạo email:', error);
      alert(`Lỗi khi tạo email: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const refineEmail = async (refinementType) => {
    setIsRefining(true);
    try {
      let prompt = '';
      switch (refinementType) {
        case 'professional':
          prompt = `Chỉnh sửa email sau để làm cho nó chuyên nghiệp hơn:\n\n${emailContent}`;
          break;
        case 'shorter':
          prompt = `Chỉnh sửa email sau để làm cho nó ngắn gọn và súc tích hơn:\n\n${emailContent}`;
          break;
        case 'personalized':
          prompt = `Chỉnh sửa email sau để làm cho nó cá nhân hóa hơn, xưng hô với người nhận bằng tên (${emailParams.customer_info.name}) và đề cập đến công ty của họ (${emailParams.customer_info.company}):\n\n${emailContent}`;
          break;
        default:
          return;
      }
      const refinedEmail = await callGeminiAPI(prompt);
      setEmailContent(refinedEmail);
    } catch (error) {
      console.error('Lỗi khi tinh chỉnh email:', error);
      alert(`Lỗi khi tinh chỉnh email: ${error.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  const scoreEmail = async () => {
    setIsScoring(true);
    setShowScoreModal(true);
    try {
      const emailEvaluationSchema = z.object({
        scores: z.object({
          subjectLine: z.number().min(0).max(10),
          writingStyle: z.number().min(0).max(10),
          content: z.number().min(0).max(10),
          structure: z.number().min(0).max(10),
          personalization: z.number().min(0).max(10),
        }),
        suggestions: z.string(),
      });

      const scoringPrompt = `
        Bạn là một chuyên gia đánh giá email.  Hãy đánh giá email sau và cung cấp:
        1. Điểm số từ 0 đến 10 cho mỗi tiêu chí sau:
           - Tiêu đề
           - Cách viết
           - Nội dung
           - Cấu trúc và định dạng
           - Cá nhân hóa
        2. Đề xuất cải thiện *ngắn gọn* cho email. Tóm tắt các ý chính, không cần giải thích dài dòng.

        Email cần đánh giá:
        ${emailContent}
      `;

      const evaluationResult = await callGeminiWithStructuredOutput(scoringPrompt, emailEvaluationSchema);
      setScores(evaluationResult.scores);
      setSuggestions(evaluationResult.suggestions);

    } catch (error) {
      console.error('Lỗi khi chấm điểm email:', error);
      alert(`Lỗi khi chấm điểm email: ${error.message}`);
      setShowScoreModal(false);
    } finally {
      setIsScoring(false);
    }
  };

  const closeModal = () => {
    setShowScoreModal(false);
  };

  const autoSuggest = async () => {
    setIsGenerating(true);
    try {
      const improvementPrompt = `
        Dựa trên phản hồi của chuyên gia, hãy viết lại và cải thiện email sau.  Cố gắng đạt được điểm số hoàn hảo.

        Email gốc:
        ${emailContent}

        Phản hồi và đề xuất ngắn gọn:
        ${suggestions}

        Email đã cải thiện:
      `;
      const improvedEmail = await callGeminiAPI(improvementPrompt);
      setEmailContent(improvedEmail);
      toast.success("Email đã được cải thiện thành công!");
      closeModal();
    } catch (error) {
      console.error('Lỗi khi tự động gợi ý email:', error);
      toast.error(`Lỗi: ${error.message}`);

    } finally {
      setIsGenerating(false);
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
              disabled={isGenerating}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
            >
              {isGenerating ? (
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